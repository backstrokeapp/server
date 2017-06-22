import * as React from 'react';
import './styles.css';
import { connect } from 'react-redux';

import collectionLinksSelect from '../../actions/collection/links/select';
import collectionLinksEnable from '../../actions/collection/links/enable';

import Switch from '../toggle-switch/index';

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
        return <li className="link-list-item" key={link.id}>
          <div className="link-list-item-header" onClick={() => onSelectLink(link.id)}>
            {link.name}
          </div>
          <div className="link-list-item-switch">
            <Switch checked={link.enabled} onChange={() => onEnableLink(link)} />
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
      {/* The header with the add link button */}
      <li className="link-list-header">
        <span className="link-list-header-content">
          <h1>My Links</h1>
          <h2>A link represents a flow of changes from one repository to another.</h2>
        </span>
        <button className="link-list-create-button">Add link</button>
      </li>

      {/* The label bar that labels the items below */}
      {links.data.length !== 0 ? <li className="link-list-labels">
        <span className="header header-name">Link Name</span>
        <span className="header header-enabled">Enabled</span>
      </li> : null}

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
