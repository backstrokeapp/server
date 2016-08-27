import 'whatwg-fetch';
import {push} from 'react-router-redux';

export default function newLink() {
  return dispatch => {
    fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/links`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      credentials: 'include',
    }).then(response => response.json()).then(data => {
      dispatch({type: 'NEW_LINK', data});
      dispatch(push(`/links/${data._id}`));
    });
  };
}