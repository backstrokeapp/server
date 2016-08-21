import React from 'react';
import {connect} from 'react-redux';

export function Repository({repo}) {
  if (repo) {
    return <div className="repo repo-view">
      <header className="repo-header">
        <h1>{repo.repository.name}</h1>
      </header>
      <ul>
        <li>Provider: {repo.provider}</li>
        <li>Type: {repo.type}</li>
        <li>Enabled: {repo.enabled ? 'yes' : 'no'}</li>
        <li>Private: {repo.repository.private ? 'yes' : 'no'}</li>
      </ul>
    </div>;
  } else {
    return <span>Loading repository...</span>;
  }
}

export default connect((state, props) => {
  return {
    repo: state.activeRepository,
  };
}, dispatch => {
  return {};
})(Repository);
