import React from 'react';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';
import classname from 'classname';
import Switch from 'react-switch-button';

export function RepositoryList({
  repos,
  children,

  onMoveToRepo,
  onRepoEnable,
}) {
  if (repos) {
    return <div className="repo-container">
      <div className="repo-list container">
        <ul>
          <li className="list-header">My Repositories</li>
          {repos.data.map((repo, ct) => {
            return <li key={ct} onClick={onMoveToRepo.bind(null, repo)} className="move-to-repo">
              {/* Provider (Github, Bitbucket, Gitlab, etc) */}
              <i className={classname('fa', 'fa-'+repo.provider, 'move-to-repo')} />
              <div className="item-title move-to-repo">{repo.name}</div>
              {/* Enabled or disabled? */}
              <Switch onChange={onRepoEnable} checked={repo.enabled ? "enabled" : "disabled"} />
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
    onMoveToRepo(repo, event) {
      // only move if the user didn't click on the switch
      if (event.target.className.indexOf('move-to-repo') !== -1) {
        let [user, reponame] = repo.name.split('/');
        dispatch(push(`/repos/${repo.provider}/${user}/${reponame}`));
      }
    },
    onRepoEnable(repo, enable=false) {
      console.log(repo, enable)
    },
  };
})(RepositoryList);
