import React from 'react';
import {connect} from 'react-redux';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import isDeletingRepo from 'actions/isDeletingRepo';
import deleteRepo from 'actions/deleteRepo';

export default function BoxProperties({repository, children}) {
  return <div className="box-properties">
    <DeleteItem repository={repository} />
    {children}
  </div>;
}


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
