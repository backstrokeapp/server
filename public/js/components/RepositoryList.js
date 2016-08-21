import React from 'react';
import {connect} from 'react-redux';

export function RepositoryList({repos}) {
  if (repos) {
    return <div className="repo-list">
      <ul>
        {repos.data.map((repo, ct) => {
          return <li key={ct}>{repo.name}</li>;
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
  return {};
})(RepositoryList);
