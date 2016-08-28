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
        placeholder="Start typing a username/repo"
        value={repo.name}
        onChange={onVerifyRepositoryName.bind(null, repo)}
      />
      <InputGroup.Addon>
        <OverlayTrigger placement="top" overlay={
          <Tooltip id="is-enabled">{validTooltip(repo)}</Tooltip>
        }>
          {validIcon(repo)}
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

export function validIcon(repo) {
  if (!repo._nameValid) {
    // not a repo
    return <i className="fa fa-times" />;
  } else if (repo.private) {
    // A private repo
    return <i className="fa fa-dollar" />;
  } else {
    // A public repo
    return <i className="fa fa-check" />;
  }
}

export function validTooltip(repo) {
  if (!repo._nameValid) {
    // not a repo
    return "This repo doesn't exist.";
  } else if (repo.private) {
    return "This repo is valid and private.";
  } else {
    // A public repo
    return "This repo is valid!";
  }
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
