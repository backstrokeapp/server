import React from 'react';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';

export function RepositoryList({
  repos,

  onMoveToRepo,
}) {
  if (repos) {
    return <div className="repo-list">
      <ul>
        {repos.data.map((repo, ct) => {
          return <li key={ct} onClick={onMoveToRepo.bind(null, repo)}>{repo.name}</li>;
        })}
      </ul>
    </div>;
  } else {
    return <span>Loading repositories...</span>;
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
