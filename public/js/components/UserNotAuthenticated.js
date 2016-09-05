import React from 'react';
import {connect} from 'react-redux';

export function UserNotAuthenticated({user}) {
  return <div className="user-not-authenticated">
    <i className="fa fa-frown-o" />
    <h1>Hmm, you don't seem to be logged in.</h1>
    <a href="/setup/login" className="btn btn-primary">Sign in with Github</a>
  </div>;
}

export default connect(state => {
  return {
    user: state.user,
  };
}, dispatch => {
  return {}
})(UserNotAuthenticated);
