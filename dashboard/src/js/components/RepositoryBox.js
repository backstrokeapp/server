import React from 'react';
import Select from 'react-select';
import {connect} from 'react-redux';
import {InputGroup, FormControl, OverlayTrigger, Tooltip} from 'react-bootstrap';

import verifyRepositoryName from 'actions/verifyRepositoryName';
import repoBranch from 'actions/repoBranch';

function RepoName({owner, repo, onChange}) {
  return <span className="repo-name-textbox-wrapper">
    <FormControl
      type="text"
      value={owner || ""}
      placeholder="Repository Owner"
      onChange={e => onChange(e.target.value, repo)}
    />
    <span className="repo-name-slash">&#x2F;</span>
    <FormControl
      type="text"
      value={repo || ""}
      placeholder="Repository Name"
      onChange={e => onChange(owner, e.target.value)}
    />
  </span>;
}

// A representation of a repository
export function RepositoryBox({
  repository: repo,
  branch,
  type,

  onVerifyRepositoryName,
  onRepoBranch,
}) {
  let branchOptions = repo.branches.map(branch => {
    return {value: branch, label: branch};
  });
  return <div className="repository-box">
    <div className="icon-wrapper">
      <a target="_blank" href={generateRepoUrl(repo)}>
        <i className="fa fa-github" />
      </a>
    </div>
    <InputGroup className="repo-name-box">
      <RepoName
        owner={repo.owner}
        repo={repo.repo}
        onChange={onVerifyRepositoryName.bind(null, repo)}
      />
      <InputGroup.Addon>
        <OverlayTrigger placement="top" overlay={
          <Tooltip id="is-enabled">{validTooltip(repo, type)}</Tooltip>
        }>
          {validIcon(repo, type)}
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

export function validIcon(repo, type) {
  if (!repo._nameValid) {
    // not a repo
    return <i className="fa fa-times" />;
  } else if (type === 'fork' && !repo.fork) {
    // not a fork
    return <i className="fa fa-times" />;
  } else if (repo.private) {
    // A private repo
    return <i className="fa fa-dollar" />;
  } else {
    // A public repo
    return <i className="fa fa-check" />;
  }
}

export function validTooltip(repo, type) {
  if (!repo._nameValid) {
    // not a repo
    return "This repo doesn't exist.";
  } else if (type === 'fork' && !repo.fork) {
    // not a fork
    return "The child repo must be a fork of the parent.";
  } else if (repo.private) {
    return "This repo is valid and private.";
  } else {
    // A public repo
    return "This repo is valid!";
  }
}

export function generateRepoUrl({provider, owner, repo}) {
  return `https://github.com/${owner}/${repo}`;
}

export default connect((state, props) => {
  return {};
}, dispatch => {
  return {
    onVerifyRepositoryName(repo, owner, repoName) {
      dispatch(verifyRepositoryName(repo, owner, repoName));
    },
    onRepoBranch(repo, event) {
      dispatch(repoBranch(repo, event.value));
    },
  };
})(RepositoryBox);
