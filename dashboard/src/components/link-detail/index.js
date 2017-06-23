import * as React from 'react';
import './styles.css';
import ColorHash from 'color-hash';
import lightness from 'lightness';
import debounce from 'lodash.debounce';

import { connect } from 'react-redux';

import Switch from '../toggle-switch/index';

import collectionLinksEnable from '../../actions/collection/links/enable';

const ch = new ColorHash();

export class LinkDetail extends React.Component {
  constructor(props) {
    super(props);
    const linkName = this.props.link ? this.props.link.name : null;
    this.state = {
      linkName,
      themeColor: ch.hex(linkName),

      forkType: this.props.link && this.props.link.fork ? this.props.link.fork.type : 'fork-all',
      forkBranch: this.props.link && this.props.link.fork ? this.props.link.fork.branch : null,
      forkBranchList: [],
    };

    // A debounced function to change the theme color. This is done so that changing the theme color
    // doesn't hapen on every keypress.
    this.updateThemeColor = debounce(function() {
      this.setState({
        themeColor: ch.hex(this.state.linkName),
      });
    }.bind(this), 1000);
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

    const darkThemeColor = lightness(this.state.themeColor, -10);
    return <div className="link-detail" style={{backgroundColor: link.enabled ? this.state.themeColor : null}}>
      <textarea
        onChange={e => {
          this.setState({linkName: e.target.value});
          this.updateThemeColor();
        }}
        className="link-detail-title"
        placeholder="Link name"
      >{this.state.linkName}</textarea>
      <div className="link-detail-switch">
        <Switch
          checked={link.enabled}
          onChange={() => this.props.onEnableLink(link)}
        />
      </div>

      <div className="link-detail-repository to">
        <div className="link-detail-repository-header">
          <span className="link-detail-repository-header-title">Upstream</span>
          <span className="link-detail-repository-header-edit">Edit</span>
        </div>
        <div className="link-detail-repository-edit">
          <div className="link-detail-repository-edit-row-two">
            <input className="link-detail-box owner" placeholder="username" value={link.upstream.owner} />
            <span className="link-detail-decorator">/</span>
            <input className="link-detail-box repo" placeholder="repository" value={link.upstream.repo} />
          </div>
          <div className="link-detail-repository-edit-row-three">
            <span className="link-detail-decorator second-row">@</span>
            <select className="link-detail-box branch second-row" value={link.upstream.branch}>
              {link.upstream.branches.map(branch => <option key={branch}>{branch}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="link-detail-repository from">
        <div className="link-detail-repository-header">
          <span className="link-detail-repository-header-title">Fork</span>
          <span className="link-detail-repository-header-edit">Edit</span>
        </div>
        <div className="link-detail-repository-edit">
          <div className="link-detail-repository-edit-row-one">
            <input
              type="radio"
              id="fork-all"
              className="link-detail-repository-radio"
              checked={this.state.forkType === 'fork-all'}
              onChange={() => this.setState({forkType: 'fork-all'})}
            />
            <label htmlFor="fork-all">All forks</label>
            <input
              type="radio"
              id="one-fork"
              className="link-detail-repository-radio"
              checked={this.state.forkType === 'repo'}
              onChange={() => this.setState({forkType: 'repo'})}
            />
            <label htmlFor="one-fork">One fork</label>
          </div>
          {this.state.forkType === 'repo' ? <div>
            <div className="link-detail-repository-edit-row-two">
              <input className="link-detail-box owner" placeholder="username" value={link.fork.owner} />
              <span className="link-detail-decorator">/</span>
              <input className="link-detail-box repo" placeholder="repository" value={link.fork.repo} />
            </div>
            <div className="link-detail-repository-edit-row-three">
              <span className="link-detail-decorator second-row">@</span>
              <select
                className="link-detail-box branch second-row"
                value={this.state.forkBranch}
                onChange={e => this.setState({forkBranch: e.target.value})}
              >
                {this.state.forkBranchList.map(branch => <option key={branch}>{branch}</option>)}
              </select>
            </div>
          </div> : null}
        </div>
      </div>
    </div>;
  }
}

export default connect(state => {
  return {
    link: state.links.data.find(link => link.id === state.links.selected),
  };
}, dispatch => {
  return {
    onEnableLink(link) {
      dispatch(collectionLinksEnable(link));
    },
  };
})(LinkDetail);
