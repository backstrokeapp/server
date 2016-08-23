import React from 'react';
import {connect} from 'react-redux';
import Select from 'react-select';

import RepositoryBox from 'components/RepositoryBox';

import linkSave from 'actions/linkSave';

export function Link({
  link,
  children,

  onLinkSave,
}) {
  if (link) {
    let fromBranchOptions = link.from.branches.map(branch => {
      return {value: branch, label: branch};
    });
    let toBranchOptions = link.to.branches.map(branch => {
      return {value: branch, label: branch};
    });

    return <div className="repo-item container">
      <header className="repo-header">
        <h1>{link.name}</h1>
      </header>

      <h3>From</h3>
      <RepositoryBox repository={link.from} branch={link.from.branch} />
      <h3>To</h3>
      <RepositoryBox repository={link.to} branch={link.to.branch} />

      {
        link._saveInProgress ? 
        <button className="btn btn-primary disabled">Loading</button> :
        <button className="btn btn-primary" onClick={onLinkSave.bind(null, link)}>Save</button>
      }

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
    link: state.activeLink,
  };
}, dispatch => {
  return {
    onLinkSave(repo) {
      dispatch(linkSave(repo));
    },
  };
})(Link);
