import React from 'react';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';
import classname from 'classname';

export function RepositoryList({
  repos,
  children,

  onMoveToRepo,
}) {
  if (repos) {
    return <div className="repo-container">
      <div className="column side-bar">
        <ul>
          <li className="list-header">My Repositories</li>
          {repos.data.map((repo, ct) => {
            return <li key={ct} onClick={onMoveToRepo.bind(null, repo)}>
              <div className="item-title">{repo.name}</div>
              <div className="icon-tray">
                <ul>
                  {/* Provider (Github, Bitbucket, Gitlab, etc) */}
                  <li><Provider provider={repo.provider} /></li>
                  {/* Enabled or disabled? */}
                  <li><EnabledCheck enabled={repo.enabled} /></li>
                </ul>
              </div>
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

// Is the given repo enabled or disabled?
export function EnabledCheck({enabled}) {
  if (enabled) {
    return <span>
      <i className={classname('fa', 'fa-check-square', 'enabled')} />
      <span>Enabled</span>
    </span>;
  } else {
    return <span>
      <i className={classname('fa', 'fa-square', 'disabled')} />
      <span>Disabled</span>
    </span>;
  }
}

// The provider for a repo (github, bitbucket, gitlab, etc)
export function Provider({provider}) {
  return <span>
    <i className={classname('fa', 'fa-'+provider)} />
    <span>
      {provider[0].toUpperCase()}
      {provider.slice(1)}
    </span>
  </span>;
}

export default connect((state, props) => {
  return {
    repos: state.repositoryList,
  };
}, dispatch => {
  return {
    onMoveToRepo(repo) {
      let [user, reponame] = repo.name.split('/');
      dispatch(push(`/repos/${repo.provider}/${user}/${reponame}`));
    },
  };
})(RepositoryList);
