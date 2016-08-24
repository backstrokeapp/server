import React from 'react';
import {connect} from 'react-redux';
import Select from 'react-select';

import RepositoryBox from 'components/RepositoryBox';
import ForkAllBox from 'components/ForkAllBox';

import linkSave from 'actions/linkSave';

export function Link({
  link,
  children,

  onLinkSave,
}) {
  if (link && link.from && link.to) {
    if (link && link.from.branches && link.to.branches) {
      let fromBranchOptions = link.from.branches.map(branch => {
        return {value: branch, label: branch};
      });
      let toBranchOptions = link.to.branches.map(branch => {
        return {value: branch, label: branch};
      });
    }

    return <div className="repo-item container">
      <header className="repo-header">
        <h1>{link.name}</h1>
      </header>

      <h3>From</h3>
      <RepoWrapper repository={link.from} branch={link.from.branch} />
      <h3>To</h3>
      <RepoWrapper repository={link.to} branch={link.to.branch} from={link.from} />

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

export function RepoWrapper({repository, branch, from}) {
  if (repository.type === 'repo') {
    return <RepositoryBox repository={repository} branch={branch} />;
  } else {
    return <ForkAllBox repository={repository} from={from} />;
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
