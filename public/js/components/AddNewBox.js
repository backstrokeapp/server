import React from 'react';
import {connect} from 'react-redux';

import addAllForks from 'actions/addAllForks';
import addNewRepository from 'actions/addNewRepository';

// Add a new repository. A repo is the only thing that can go in a from slot.
export function AddNewBox({type, onAddNewRepository, onAddAllForks}) {
  return <div className="add-new-box">
    Add new:
    <button className="btn btn-primary" onClick={onAddNewRepository.bind(null, type)}>
      Repository
    </button>
    {
      type === 'to' ?
      <button className="btn btn-primary" onClick={onAddAllForks.bind(null, type)}>
        All Forks
      </button>:
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
