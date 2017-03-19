/* vim: set syntax=javascript.jsx : */
import React from 'react';
import {connect} from 'react-redux';
import classname from 'classname'

import addAllForks from 'actions/addAllForks';
import addNewRepository from 'actions/addNewRepository';

// Add a new repository. A repo is the only thing that can go in a upstream slot.
export function AddNewBox({type, onAddNewRepository, onAddAllForks, dim}) {
  return <div className="add-new-box">
    <div className={classname(
      "add-new-option",
      `add-new-option-${type}`, {
        'add-new-option-muted': dim
      })
    }>
      <button className="btn" onClick={onAddNewRepository.bind(null, type)}>
        <i className="fa fa-plus-square-o" />
        {
          type === 'fork' ?
          'Sync changes to a repository':
          'First, add a source to sync changes from.'
        }
      </button>
    </div>
    {
      type === 'fork' ?
      <div className={classname(
        "add-new-option",
        "add-new-option-to", {
          'add-new-option-muted': dim
        })
      }>
        <button className="btn" onClick={dim ? null : onAddAllForks.bind(null, type)}>
          <i className="fa fa-plus-square-o" />
          Sync changes to all forks
        </button>
      </div>:
      null
    }
  </div>;
}

export default connect((state, props) => {
  return {
    type: props.type,
  };
}, dispatch => {
  return {
    onAddNewRepository(slot) {
      dispatch(addNewRepository(slot));
    },
    onAddAllForks(slot) {
      if (slot === 'fork') {
        dispatch(addAllForks('fork'));
      }
    },
  };
})(AddNewBox);
