import 'whatwg-fetch';
import {push} from 'react-router-redux';

export default function newLink() {
  return dispatch => {
    fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/repos`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
    }).then(response => response.json()).then(data => {
      dispatch({type: 'NEW_LINK', data});
      dispatch(push(`/links/${data._id}`));
    });
  };
}
