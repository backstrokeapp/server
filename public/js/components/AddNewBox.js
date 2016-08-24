import React from 'react';
import {connect} from 'react-redux';

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
      console.log('adding a new repository');
    },
    onAddAllForks(slot) {
      if (slot === 'to') {
        console.log('adding all forks');
      }
    },
  };
})(AddNewBox);
