import * as React from 'react';
import './styles.css';
import { connect } from 'react-redux';

import ColorHash from 'color-hash';
import lightness from 'lightness';

import collectionLinksSelect from '../../actions/collection/links/select';
import collectionLinksEnable from '../../actions/collection/links/enable';
import collectionLinksCreate from '../../actions/collection/links/create';

import Switch from '../toggle-switch/index';
import LinkError from '../link-error/index';
import LinkLoading from '../link-loading/index';
import Button from '../button/index';

const ch = new ColorHash();

export function LinkList({
  links,

  onEnableLink,
  onSelectLink,
  onCreateLink,
}) {
  let body;

  if (links.error) {
    body = <LinkError error={links.error} />;
  } else if (links.loading) {
    body = <LinkLoading />;
  } else if (links.data.length === 0) {
    body = <ul className="link-list">
      <li className="link-list-item-empty">
        You have no links, create one above.
      </li>
    </ul>
  } else {
    body = <ul className="link-list">
      {links.data.map(link => {
        const themeColor = ch.hex(link.name);
        const darkThemeColor = lightness(themeColor, -10);

        return <li
          className="link-list-item"
          key={link.id}
          style={{backgroundColor: link.enabled ? themeColor : null}}
        >
          <div className="link-list-item-header">
            {link.name || "Untitled"}
          </div>
          <div className="link-list-item-switch">
            <Switch checked={link.enabled} onChange={() => onEnableLink(link)} />
            <div
              className="link-list-item-edit"
              onClick={() => onSelectLink(link.id)}
            >Edit</div>
          </div>
        </li>;
      })}
    </ul>;
  }

  return <div className="link-list-container">
    <img
      alt="Backstroke"
      className="link-list-logo"
      src="/assets/img/logo.png"
    />

  <div className="link-list-create-button-container">
    <Button
      className="link-list-create-button"
      color="dark"
      onClick={onCreateLink}
    >New Link</Button>
  </div>

    {/* The list "card" of links */}
    {body}

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
    onCreateLink() {
      dispatch(collectionLinksCreate()).then(link => {
        if (link) {
          window.location.hash = '/links/' + link.id;
        }
      });
    },
    onEnableLink(link) {
      dispatch(collectionLinksEnable(link));
    },
  }
})(LinkList);
