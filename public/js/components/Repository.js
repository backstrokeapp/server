import React from 'react';
import {connect} from 'react-redux';

export function Repository({
  repo,
  children,
}) {
  if (repo) {
    return <div className="column repo">
      <header className="repo-header">
        <h1>{repo.repository.name}</h1>
      </header>
      <ul>
        <li>Provider: {repo.repository.provider}</li>
        <li>Type: {repo.type}</li>
        <li>Enabled: {repo.enabled ? 'yes' : 'no'}</li>
        <li>Private: {repo.repository.private ? 'yes' : 'no'}</li>
      </ul>

      <ul>
        {repo.changes.map((change, ct) => {
          return <li key={ct}>
            <h3>{change.type}</h3>
            Issue to <strong>{change.repository.name}</strong>
            on branch <strong>{change.branch}</strong>.
          </li>;
        })}
      </ul>

      {children}
    </div>;
  } else {
    return <div className="column repo">
      <span>Loading repository...</span>
      {children}
    </div>;
  }
}

export default connect((state, props) => {
  return {
    repo: state.activeRepository,
  };
}, dispatch => {
  return {};
})(Repository);
