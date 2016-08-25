import React from 'react';
import Select from 'react-select';
import {connect} from 'react-redux';
import {InputGroup, FormControl, OverlayTrigger, Tooltip} from 'react-bootstrap';

import verifyRepositoryName from 'actions/verifyRepositoryName';
import repoBranch from 'actions/repoBranch';
import cancelRepoDelete from 'actions/cancelRepoDelete';

// A representation of a repository
export function RepositoryBox({
  repository: repo,
  branch,

  onVerifyRepositoryName,
  onRepoBranch,
  onCancelRepoDelete,
}) {
  let branchOptions = repo.branches.map(branch => {
    return {value: branch, label: branch};
  });
  return <div className="repository-box" onClick={onCancelRepoDelete.bind(null, repo)}>
    <div className="icon-wrapper">
      <i className={'fa fa-'+repo.provider} />
    </div>
    <InputGroup className="repo-name-box">
      <FormControl
        type="text"
        placeholder="Start typing a username/repo"
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
      placeholder={branchOptions.length === 0 ? "Type a valid repo for a list of branches" : "Select a branch"}
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
    onCancelRepoDelete(data) {
      if (data._deleting) {
        dispatch(cancelRepoDelete(data));
      }
    }
  };
})(RepositoryBox);
