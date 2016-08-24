import React from 'react';
import {connect} from 'react-redux';
import Select from 'react-select';

import RepositoryBox from 'components/RepositoryBox';
import ForkAllBox from 'components/ForkAllBox';
import BoxProperties from 'components/BoxProperties';

import linkSave from 'actions/linkSave';

export function Link({
  link,
  children,

  onLinkSave,
}) {
  if (link) {
    // fetch branches, if required
    if (link.from && link.from.branches) {
      let fromBranchOptions = link.from.branches.map(branch => {
        return {value: branch, label: branch};
      });
    }
    if (link.to && link.to.branches) {
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
    return <BoxProperties repository={repository}>
      <RepositoryBox repository={repository} branch={branch} />
    </BoxProperties>;
  } else if (repository.type === 'fork-all') {
    return <BoxProperties repository={repository}>
      <ForkAllBox repository={repository} from={from} />
    </BoxProperties>;
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
