import React from 'react';
import {connect} from 'react-redux';

import addAllForks from 'actions/addAllForks';
import addNewRepository from 'actions/addNewRepository';

// Add a new repository. A repo is the only thing that can go in a from slot.
export function AddNewBox({type, onAddNewRepository, onAddAllForks}) {
  return <div className="add-new-box">
    <div className="add-new-option">
      <button className="btn" onClick={onAddNewRepository.bind(null, type)}>
        <i className="fa fa-plus-square-o" />
        {
          type === 'to' ?
          'Sync changes to a repository':
          'First, add a source to sync changes from.'
        }
      </button>
    </div>
    {
      type === 'to' ?
      <div className="add-new-option">
        <button className="btn" onClick={onAddAllForks.bind(null, type)}>
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
      if (slot === 'to') {
        dispatch(addAllForks('to'));
      }
    },
  };
})(AddNewBox);
