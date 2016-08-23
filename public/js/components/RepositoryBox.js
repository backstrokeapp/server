import React from 'react';
import Select from 'react-select';

// A representation of a repository
export default function RepositoryBox({repository: repo, branch}) {
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
    />
    <Select
      options={branchOptions}
      value={branch}
      className="branch-name-box"
      clearable={false}
    />
  </div>;
}
