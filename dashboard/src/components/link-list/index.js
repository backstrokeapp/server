import * as React from 'react';
import './styles.css';
import { connect } from 'react-redux';

import ColorHash from 'color-hash';
import lightness from 'lightness';

import collectionLinksSelect from '../../actions/collection/links/select';
import collectionLinksEnable from '../../actions/collection/links/enable';

import Switch from '../toggle-switch/index';

const ch = new ColorHash();

export function LinkList({
  links,

  onEnableLink,
  onSelectLink,
}) {
  let body;

  if (links.error) {
    body = <li className="link-list-item error">
      {links.error}
    </li>;
  } else if (links.loading) {
    body = <li className="link-list-item loading">
      Loading...
    </li>;
  } else if (links.data.length === 0) {
    body = <li className="link-list-item-empty">
      You have no links, create one above.
    </li>;
  } else {
    body = <div>
      {links.data.map(link => {
        const themeColor = ch.hex(link.name);
        const darkThemeColor = lightness(themeColor, -10);

        return <li
          className="link-list-item"
          key={link.id}
          style={{backgroundColor: link.enabled ? themeColor : null}}
        >
          <div className="link-list-item-header" onClick={() => onSelectLink(link.id)}>
            {link.name}
          </div>
          <div className="link-list-item-switch">
            <Switch checked={link.enabled} onChange={() => onEnableLink(link)} />
            <div className="link-list-item-edit">Edit</div>
          </div>
        </li>;
      })}
    </div>;
  }

  return <div className="link-list-container">
    <img
      alt="Backstroke"
      className="link-list-logo"
      src="/assets/img/logo.png"
    />

    {/* The list "card" of links */}
    <ul className="link-list">
      {body}
    </ul>

    <div className="link-list-footer">
      <a className="logout" href="/logout">Logout 1egoman</a>
    </div>
  </div>;
}

export default connect(state => {
  return {
    links: state.links,
  };
}, dispatch => {
  return {
    onSelectLink(id) {
      window.location.hash = '/links/' + id;
    },
    onEnableLink(link) {
      dispatch(collectionLinksEnable(link));
    },
  }
})(LinkList);
