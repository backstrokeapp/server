import {push} from 'react-router-redux';

export default function deleteLink(linkId) {
  return dispatch => {
    fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/links/${linkId}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(resp => {
      if (resp.ok) {
        dispatch({type: 'DELETE_LINK', link: linkId});
        dispatch(push('/links'));
      } else {
        return resp.json().then(error => {
          dispatch({type: 'DELETE_LINK_ERROR', link: linkId, error})
        });
      }
    });
  };
}
