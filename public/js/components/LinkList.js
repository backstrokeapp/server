import React from 'react';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';
import classname from 'classname';
import Switch from 'react-ios-switch';

import enableDisableLink from 'actions/enableDisableLink';

export function LinkList({
  links,
  children,

  onMoveToRepo,
  onLinkEnable,
}) {
  if (links) {
    return <div className="repo container">
      <div className="repo-list container">
        <ul>
          <li className="list-header">My Repositories</li>
          {links.data.map((link, ct) => {
            return <li
              key={ct}
              onClick={onMoveToRepo.bind(null, link)}
              className={classname('move-to-repo', {grayed: !link.enabled})}
            >
              {/* Provider (Github, Bitbucket, Gitlab, etc) */}
              <i className={classname('fa', 'fa-'+link.provider, 'move-to-repo')} />
              <div className="item-title move-to-repo">{link.name}</div>
              {/* Enabled or disabled? */}
              <Switch
                onChange={onLinkEnable.bind(null, link, !link.enabled)}
                checked={link.enabled}
                disabled={link._pending}
              />
            </li>;
          })}
        </ul>
      </div>
      {children}
    </div>;
  } else {
    return <div className="repo-list">
      <span>Loading repositories...</span>
      {children}
    </div>;
  }
}

export default connect((state, props) => {
  return {
    links: state.linkList,
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
  };
})(LinkList);
