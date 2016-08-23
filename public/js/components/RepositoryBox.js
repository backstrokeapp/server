import React from 'react';
import Select from 'react-select';
import {connect} from 'react-redux';

import verifyRepositoryName from 'actions/verifyRepositoryName';
import repoBranch from 'actions/repoBranch';

// A representation of a repository
export function RepositoryBox({
  repository: repo,
  branch,

  onVerifyRepositoryName,
  onRepoBranch,
}) {
  let branchOptions = repo.branches.map(branch => {
    return {value: branch, label: branch};
  });
  return <div className="repository-box">
    <div className="icon-wrapper">
      <i className={'fa fa-'+repo.provider} />
    </div>
    <input
      type="text"
      placeholder="username/repo"
      value={repo.name}
      className="repo-name-box form-control"
      onChange={onVerifyRepositoryName.bind(null, repo)}
    />
    <Select
      options={branchOptions}
      value={branch}
      className="branch-name-box"
      clearable={false}
      onChange={onRepoBranch.bind(null, repo)}
    />
  </div>;
}

export default connect((state, props) => {
  return {};
}, dispatch => {
  return {
    onVerifyRepositoryName(repo, event) {
      dispatch(verifyRepositoryName(repo, event.target.value));
    },
    onRepoBranch(repo, event) {
      dispatch(repoBranch(repo, event.value));
    },
  };
})(RepositoryBox);
