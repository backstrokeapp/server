import React from 'react';
import Select from 'react-select';
import {connect} from 'react-redux';
import {InputGroup, FormControl, OverlayTrigger, Tooltip} from 'react-bootstrap';

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
    <InputGroup className="repo-name-box">
      <FormControl
        type="text"
        placeholder="username/repo"
        value={repo.name}
        onChange={onVerifyRepositoryName.bind(null, repo)}
      />
      <InputGroup.Addon>
        <OverlayTrigger placement="top" overlay={
          <Tooltip id="is-enabled">
            {repo._nameValid ? "This repo is valid!" : "This repo doesn't exist."}
          </Tooltip>
        }>
          {repo._nameValid ? <i className="fa fa-check" /> : <i className="fa fa-times" />}
        </OverlayTrigger>
      </InputGroup.Addon>
    </InputGroup>
    <Select
      options={branchOptions}
      value={branch}
      className="branch-name-box"
      clearable={false}
      onChange={onRepoBranch.bind(null, repo)}
      disabled={branchOptions.length === 0}
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
