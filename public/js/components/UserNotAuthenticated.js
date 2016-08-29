import React from 'react';
import {connect} from 'react-redux';

export function UserNotAuthenticated({user}) {
  return <div className="user-not-authenticated">
    <a href="/setup/login" className="btn btn-primary">Please login first</a>
  </div>;
}

export default connect(state => {
  return {
    user: state.user,
  };
}, dispatch => {
  return {}
})(UserNotAuthenticated);
