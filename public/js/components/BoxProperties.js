import React from 'react';
import {connect} from 'react-redux';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import isDeletingRepo from 'actions/isDeletingRepo';
import deleteRepo from 'actions/deleteRepo';

export default function BoxProperties({repository, children}) {
  return <div className="box-properties">
    {children}
    <div className="box-items">
      <ul>
        <DeleteItem repository={repository} />
        <li className="disabled">
          <i className="fa fa-wpforms" />
          <OverlayTrigger placement="right" overlay={
            <Tooltip id="is-coming-soon">Coming soon!</Tooltip>
          }>
            <span>Change Provider</span>
          </OverlayTrigger>
        </li>
      </ul>
    </div>
  </div>;
}


export function DeleteItemComponent({repository, onDelete, onIsSure}) {
  let text;
  if (repository._deleting) {
    text = <span onClick={onIsSure.bind(null, repository)}>Sure?</span>;
  } else {
    text = <span onClick={onDelete.bind(null, repository)}>Delete</span>;
  }

  return <li className="text-danger">
    <i className="fa fa-times" />
    {text}
  </li>;
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
