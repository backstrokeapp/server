import React from 'react';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';
import classname from 'classname';
import Switch from 'react-switch-button';

export function RepositoryList({
  repos,
  children,

  onMoveToRepo,
}) {
  if (repos) {
    return <div className="repo-container">
      <div className="repo-list container">
        <ul>
          <li className="list-header">My Repositories</li>
          {repos.data.map((repo, ct) => {
            return <li key={ct}>
              {/* Provider (Github, Bitbucket, Gitlab, etc) */}
              <i className={classname('fa', 'fa-'+repo.provider)} />
              <div className="item-title" onClick={onMoveToRepo.bind(null, repo)}>
                {repo.name}
              </div>
              {/* Enabled or disabled? */}
              <Switch checked={repo.enabled ? "enabled" : "disabled"} />
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
