import * as React from 'react';
import './styles.css';
import ColorHash from 'color-hash';
import debounce from 'lodash.debounce';
import classnames from 'classnames';

import { connect } from 'react-redux';

import Switch from '../toggle-switch/index';
import LinkError from '../link-error/index';
import LinkLoading from '../link-loading/index';
import Button from '../button/index';

import collectionLinksEnable from '../../actions/collection/links/enable';
import collectionLinksSave from '../../actions/collection/links/save';
import collectionLinksDelete from '../../actions/collection/links/delete';

import { API_URL } from '../../constants';

const ch = new ColorHash();

function getDefaultBranch(branchList) {
  if (branchList.indexOf('master') !== -1) {
    return 'master';
  } else if (branchList.indexOf('trunk') !== -1) {
    return 'trunk';
  } else {
    return branchList[0];
  }
}

export class LinkDetail extends React.Component {
  constructor(props) {
    super(props);
    const link = this.props.initialLinkState;
    const linkName = (link && link.name) || '';

    // Construct initial state given the initial link as a template.
    this.state = {
      linkName,
      themeColor: ch.hex(linkName),
      upstreamError: null,
      forkError: null,

      upstreamOwner: link && link.upstream ? link.upstream.owner : '',
      upstreamRepo: link && link.upstream ? link.upstream.repo : '',
      upstreamBranch: link && link.upstream ? link.upstream.branch : '',
      upstreamBranchList: (link && link.upstream && link.upstream.branches) || [],

      forkOwner: (link && link.fork && link.fork.owner) || '',
      forkRepo: (link && link.fork && link.fork.repo) || '',
      forkBranch: (link && link.fork && link.fork.branch) || '',
      forkBranchList: (link && link.fork && link.fork.branches) || [],
      forkType: link && link.fork ? link.fork.type : 'fork-all',
    };

    // A debounced function to change the theme color. This is done so that changing the theme color
    // doesn't hapen on every keypress.
    this.updateThemeColor = debounce(function() {
      this.setState({
        themeColor: ch.hex(this.state.linkName),
      });
    }.bind(this), 1000);

    // Also debounce fetchBranches, so branches are only fetched when the user stops typing and not
    // after every keypress.
    this.fetchBranches = debounce(this.fetchBranches.bind(this), 250);
  }

  // Given a direction (ie, `fork` or `owner`), validate the owner/repo combo and update the
  // respective branches.
  fetchBranches(direction) {
    const owner = this.state[`${direction}Owner`],
          repo = this.state[`${direction}Repo`],
          branch = this.state[`${direction}Branch`];

    // Only run query when both an aowner and repo are defined.
    if (!owner || !repo) {
      return;
    }

    return fetch(`${API_URL}/v1/repos/github/${owner}/${repo}`, {
      credentials: 'include',
    }).then(resp => {
      if (owner.length && repo.length) {
        return resp.json();
      } else {
        return {valid: false};
      }
    }).then(body => {
      // Ensure that the fork is a fork
      if (direction === 'fork' && body.fork === false) {
        this.setState({
          [`${direction}Error`]: `Repo ${owner}/${repo} isn't a fork.`,
        });
        return;
      }

      // Update the branch list if there are branches.
      if (body.valid) {
        this.setState({
          [`${direction}BranchList`]: body.branches,
          [`${direction}Error`]: null,
          [`${direction}Branch`]: branch ? branch : getDefaultBranch(body.branches),
        });
      } else {
        this.setState({
          [`${direction}BranchList`]: [],
          [`${direction}Error`]: `${owner}/${repo} not found.`,
        });
      }
    });
  }

  isLinkValid() {
    return this.state.linkName && this.state.linkName.length > 0 && (
      this.state.upstreamError === null && this.state.forkError === null
    ) && (
      // Upstream is valid?
      this.state.upstreamOwner && this.state.upstreamRepo && this.state.upstreamBranch
    ) && (
      // Fork is valid?
      (this.state.forkType === 'repo' && this.state.forkOwner && this.state.forkRepo && this.state.forkBranch)
      || this.state.forkType === 'fork-all'
    )
  }

  // Assemble a complete link using the updated elements in this component's state.
  makeLink() {
    return {
      ...this.props.initialLinkState,
      name: this.state.linkName,
      enabled: true,

      upstream: {
        ...this.props.initialLinkState.upstream,
        type: 'repo',
        owner: this.state.upstreamOwner,
        repo: this.state.upstreamRepo,
        branch: this.state.upstreamBranch,
        branches: this.state.upstreamBranchList,
      },

      fork: {
        ...this.props.initialLinkState.fork,
        type: this.state.forkType,
        owner: this.state.forkOwner,
        repo: this.state.forkRepo,
        branch: this.state.forkBranch,
        branches: this.state.forkBranchList,
      },
    }
  }

  render() {
    const link = this.props.initialLinkState;

    if (!link) {
      return <div className="link-detail-empty">
        No such link was found.
      </div>;
    }

    return <div>
      {/* report any errors */}
      <LinkError error={this.props.linkError} />

      <div className="link-detail" style={{backgroundColor: link.enabled ? this.state.themeColor : null}}>
        <textarea
          onChange={e => {
            this.setState({linkName: e.target.value});
            this.updateThemeColor();
          }}
          className="link-detail-title"
          placeholder="Link name"
          value={this.state.linkName}
        />
        <div className="link-detail-switch">
          <Switch
            checked={link.enabled}
            onChange={() => this.props.onEnableLink(link)}
          />
        </div>

        <div className="link-detail-repository to">
          <div className="link-detail-repository-header">
            <span className="link-detail-repository-header-title">Upstream</span>
            <span className="link-detail-repository-header-error">{this.state.upstreamError}</span>
          </div>
          <div className="link-detail-repository-edit">
            <div className="link-detail-repository-edit-row-owner-name">
              <input
                className="link-detail-box owner"
                placeholder="username"
                value={this.state.upstreamOwner}
                onChange={e => {
                  this.setState({upstreamOwner: e.target.value})
                  this.fetchBranches('upstream');
                }}
                onKeyDown={e => {
                  // Skip to repo box when slash is pressed.
                  if (e.key === '/') {
                    this.upstreamRepoBox.focus()
                    e.preventDefault();
                  }
                }}
              />
              <span className="link-detail-decorator">/</span>
              <input
                className="link-detail-box repo"
                placeholder="repository"
                ref={ref => this.upstreamRepoBox = ref}
                value={this.state.upstreamRepo}
                onChange={e => {
                  this.setState({upstreamRepo: e.target.value})
                  this.fetchBranches('upstream');
                }}
              />
            </div>
            <div className="link-detail-repository-edit-row-three">
              <select
                className="link-detail-box branch"
                onChange={e => this.setState({upstreamBranch: e.target.value})}
                value={this.state.upstreamBranch}
              >
                {this.state.upstreamBranchList.map(branch => <option key={branch}>{branch}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="link-detail-repository from">
          <div className="link-detail-repository-header">
            <span className="link-detail-repository-header-title">Fork</span>
            <span className="link-detail-repository-header-error">{this.state.forkError}</span>
          </div>
          <div className="link-detail-repository-edit">
            <div className="link-detail-repository-edit-row-fork-radios">
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
              <div className="link-detail-repository-edit-row-owner-name">
                <input
                  className="link-detail-box owner"
                  placeholder="username"
                  value={this.state.forkOwner}
                  onChange={e => {
                    this.setState({forkOwner: e.target.value})
                    this.fetchBranches('fork');
                  }}
                  onKeyDown={e => {
                    // Skip to repo box when slash is pressed.
                    if (e.key === '/') {
                      this.forkRepoBox.focus()
                      e.preventDefault();
                    }
                  }}
                />
                <span className="link-detail-decorator">/</span>
                <input
                  className="link-detail-box repo"
                  placeholder="repository"
                  value={this.state.forkRepo}
                  ref={ref => this.forkRepoBox = ref}
                  onChange={e => {
                    this.setState({forkRepo: e.target.value})
                    this.fetchBranches('fork');
                  }}
                />
              </div>
              <div className="link-detail-repository-edit-row-three">
                <select
                  className="link-detail-box branch"
                  value={this.state.forkBranch}
                  onChange={e => this.setState({forkBranch: e.target.value})}
                >
                  {this.state.forkBranchList.map(branch => <option key={branch}>{branch}</option>)}
                </select>
              </div>
            </div> : null}
          </div>
        </div>

        <div className="link-detail-save-button-container">
          <Button
            className={classnames(`save-button`)}
            disabled={!this.isLinkValid()}
            onClick={() => this.isLinkValid() && this.props.onSaveLink(this.makeLink())}
          >Save</Button>
        </div>
      </div>

      <div className="link-detail-footer">
        <div className="delete-button" onClick={() => this.props.onDeleteLink(this.makeLink())}>Delete</div>
      </div>
    </div>;
  }
}

export default connect(state => {
  return {
    link: state.links.data.find(link => link.id === state.links.selected),
    links: state.links,
  };
}, dispatch => {
  return {
    onEnableLink(link) {
      dispatch(collectionLinksEnable(link));
    },
    onSaveLink(link) {
      dispatch(collectionLinksSave(link)).then(ok => {
        if (ok) {
          window.location.hash = '#/links';
        }
      });
    },
    onDeleteLink(link) {
      if (window.confirm('Are you sure you want to delete this link?')) {
        dispatch(collectionLinksDelete(link)).then(() => {
          window.location.hash = '#/links';
        });
      }
    },
  };
})(function(props) {
  if (!props.links.loading) {
    return <LinkDetail {...props} initialLinkState={props.link} linkError={props.links.error} />;
  } else {
    return <LinkLoading />;
  }
});
