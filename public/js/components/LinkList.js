import React from 'react';
import {connect} from 'react-redux';
import classname from 'classname';
import Switch from 'react-ios-switch';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import enableDisableLink from 'actions/enableDisableLink';
import newLink from 'actions/newLink';
import UserNotAuthenticated from 'components/UserNotAuthenticated';

import moveToLink from 'actions/moveToLink';

export function LinkList({
  links,
  user,
  children,

  onMoveToRepo,
  onLinkEnable,
  onNewLink,
}) {
  if (links) {
    return <div className="repo container">
      <div className="link-list">
        <ul className="list-group">
          {/* Section header */}
          {links.data.length > 0 ? <li className="list-header">
            <h1>
              Links join two repos together.<br/>
              Here are yours.
            </h1>

            <button className="btn btn-outline btn-outline-primary btn-default btn-lg" onClick={onNewLink}>
              Add link
            </button>
          </li> : null}

          {/* Link list */}
          {links.data.map((link, ct) => {
            return <li
              key={ct}
              onClick={onMoveToRepo.bind(null, link)}
              className={classname('move-to-repo', 'list-group-item', {grayed: !link.enabled})}
            >
              <div className="item-title move-to-repo">{link.name || 'Untitled Link'}</div>

              {/* Do you have to pay for a link? */}
              {
                link.paid ?
                <OverlayTrigger placement="left" overlay={<Tooltip id="is-paid">
                  This link is premium since it has a private repository inside.
                </Tooltip>}>
                  <i className={classname('fa', 'fa-money', 'move-to-repo')} />
                </OverlayTrigger>
                : null
              }

              {/* Enabled or disabled? */}
              <Switch
                onChange={onLinkEnable.bind(null, link, !link.enabled)}
                checked={link.enabled}
                disabled={link._pending}
              />
            </li>;
          })}

          {/* When there are no links */}
          {links.data.length === 0 ? <li className="link-empty">
            <h1>
              Links connect an upstream repository<br/>
              to one or many downstream repositories.
            </h1>
            <i className="fa fa-anchor" />
            <p>
              <a className="btn btn-success btn-lg" onClick={onNewLink}>
                Create a link
              </a>
            </p>
          </li> : null}
        </ul>
      </div>

      {children}
    </div>;
  } else if (user && !user._auth) {
    return <UserNotAuthenticated />;
  } else {
    return <div className="loading container">
      <span>Loading your links...</span>
      {children}
    </div>;
  }
}

export default connect((state, props) => {
  return {
    links: state.linkList,
    user: state.user,
  };
}, dispatch => {
  return {
    onMoveToRepo(link, event) {
      // only move if the user didn't click on the switch
      if (event.target.className.indexOf('move-to-repo') !== -1) {
        dispatch(moveToLink(link._id));
      }
    },
    onLinkEnable(link, enabled) {
      dispatch(enableDisableLink(link, enabled));
    },
    onNewLink() {
      dispatch(newLink());
    },
  };
})(LinkList);
