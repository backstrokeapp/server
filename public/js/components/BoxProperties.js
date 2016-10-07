import React from 'react';
import {connect} from 'react-redux';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import isDeletingRepo from 'actions/isDeletingRepo';
import deleteRepo from 'actions/deleteRepo';
import cancelRepoDelete from 'actions/cancelRepoDelete';

// this doesn't have a conenct ---- add one.
export function BoxProperties({repository, onCancelRepoDelete, children}) {
  return <div className="box-properties" onClick={onCancelRepoDelete.bind(null, repository)}>
    <DeleteItem repository={repository} />
    {children}
  </div>;
}

export default connect(state => {
  return {};
}, dispatch => {
  return {
    onCancelRepoDelete(data) {
      if (data._deleting) {
        dispatch(cancelRepoDelete(data));
      }
    },
  };
})(BoxProperties);


export function DeleteItemComponent({repository, onDelete, onIsSure}) {
  let item;
  if (repository._deleting) {
    return <div
      className="btn btn-delete btn-delete-expanded"
      onClick={onIsSure.bind(null, repository)}
    >Are you sure?</div>
  } else {
    return <div
      className="btn btn-delete"
      onClick={onDelete.bind(null, repository)}
    >&times;</div>
  }
}

export const DeleteItem = connect((state, props) => {
  return {
    repository: props.repository,
  };
}, dispatch => {
  return {
    onDelete(repo) {
      dispatch(isDeletingRepo(repo));
    },
    onIsSure(repo) {
      dispatch(deleteRepo(repo));
    },
  };
})(DeleteItemComponent);
