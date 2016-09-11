import React from 'react';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';
import classname from 'classname';
import Switch from 'react-ios-switch';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import enableDisableLink from 'actions/enableDisableLink';
import newLink from 'actions/newLink';
import UserNotAuthenticated from 'components/UserNotAuthenticated';

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
          {/* header */}
          <li className="list-header">
            My links
          </li>

          {links.data.map((link, ct) => {
            return <li
              key={ct}
              onClick={onMoveToRepo.bind(null, link)}
              className={classname('move-to-repo', 'list-group-item', {grayed: !link.enabled})}
            >
              {/* Provider (Github, Bitbucket, Gitlab, etc) */}
              <i className={classname('fa', 'fa-'+link.provider, 'move-to-repo')} />
              <div className="item-title move-to-repo">{link.name || 'Untitled Link'}</div>

              {/* Do you have to pay for a link? */}
              {
                link.paid ?
                <OverlayTrigger placement="left" overlay={<Tooltip id="is-paid">
                  This link is paid since it has a private repository inside.
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
        </ul>
        <button className="btn btn-success" onClick={onNewLink}>Add new link</button>

        <div className="monthly-price">
          ${links.totalPrice && links.totalPrice.toFixed(2)} per month
        </div>
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
        dispatch(push(`/links/${link._id}`));
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
