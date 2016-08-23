import React from 'react';
import {connect} from 'react-redux';
import Select from 'react-select';

import RepositoryBox from 'components/RepositoryBox';

export function Repository({
  repo,
  children,
}) {
  if (repo) {
    let branchOptions = repo.repository.branches.map(branch => {
      return {value: branch, label: branch};
    });

    return <div className="repo-item container">
      <header className="repo-header">
        <h1>{repo.repository.name}</h1>
      </header>
      <ul>
        <li>Provider: {repo.repository.provider}</li>
        <li>Type: {repo.type}</li>
        <li>Enabled: {repo.enabled ? 'yes' : 'no'}</li>
        <li>Private: {repo.repository.private ? 'yes' : 'no'}</li>
      </ul>

      <div className="master-branch-box">
        <span className="lead-in">When the </span>
        <div className="select-wrapper">
          <Select
            options={branchOptions}
            value="master"
            className="branch-name-box"
            clearable={false}
          />
        </div>
        <span className="lead-out">branch is updated:</span>
      </div>

      <ul>
        {repo.changes.map((change, ct) => {
          return <li key={ct}>
            {change.items.map((item, ct) => {
              return <div className="sub-change">
                <div className="count-item">{ct+1}</div>
                <ChangeDescription slug={item.type} />
                <RepositoryBox repository={item.repository} branch={item.branch} />
              </div>;
            })}
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

export function ChangeDescription({slug}) {
  switch(slug) {
    case 'pull_request':
      return <span className="change-description">Propose a change in a pull request</span>;
    default:
      return null;
  }
}

export default connect((state, props) => {
  return {
    repo: state.activeRepository,
  };
}, dispatch => {
  return {};
})(Repository);
