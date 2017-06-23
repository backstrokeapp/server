import * as React from 'react';
import './styles.css';
import ColorHash from 'color-hash';
import lightness from 'lightness';

import { connect } from 'react-redux';

const ch = new ColorHash();

export class LinkDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      linkName: this.props.link ? this.props.link.name : null,
    };
  }
  render() {
    const {
      link,
    } = this.props;

    if (!link) {
      return <div className="link-detail-empty">
        No such link was found.
      </div>;
    }

    const themeColor = ch.hex(link.name);
    const darkThemeColor = lightness(themeColor, -10);

    return <div className="link-detail" style={{backgroundColor: themeColor}}>
      <div className="link-detail-header">
        <input type="text" value={this.state.linkName} />
        <span className="link-detail-delete">Delete</span>
      </div>
      <div className="link-detail-repository to">
        <span className="link-detail-owner">{link.upstream.owner}</span>
        <span className="link-detail-name">{link.upstream.repo}</span>
        <span className="link-detail-branch">{link.upstream.branch}</span>
        <span className="link-detail-edit">Edit</span>
      </div>
      <div className="link-detail-repository from">
        <span className="link-detail-owner">{link.fork.owner}</span>
        <span className="link-detail-name">{link.fork.repo}</span>
        <span className="link-detail-branch">{link.fork.branch}</span>
        <span className="link-detail-edit">Edit</span>
      </div>
      <div className="link-detail-footer" style={{backgroundColor: darkThemeColor}}>
        <span className="link-detail-submit">Save</span>
      </div>
    </div>;
  }
}

export default connect(state => {
  return {
    link: state.links.data.find(link => link.id === state.links.selected),
  };
}, dispatch => {
  return {};
})(LinkDetail);
