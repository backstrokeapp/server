import {push} from 'react-router-redux';

export default function deleteLink(linkId) {
  return dispatch => {
    fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/links/${linkId}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(response => response.json()).then(json => {
      dispatch({type: 'DELETE_LINK', link: linkId});
      dispatch(push('/links'));
    });
  };
}
