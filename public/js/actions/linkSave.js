import 'whatwg-fetch';
import {push} from 'react-router-redux';
import linkSaveError from 'actions/linkSaveError';

export default function linkSave(link) {
  return dispatch => {
    dispatch(linkSaveInProgress(link));
    fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/links/${link.id}`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({link}),
      credentials: 'include',
    }).then(response => response.json()).then(json => {
      if (json.error) {
        dispatch(linkSaveError(json.error));
      } else {
        dispatch(linkSaveAction(link, json.status));
        dispatch(push('/links'));
      }
    });
  };
}

export function linkSaveAction(link, status) {
  return {type: 'LINK_SAVE', link, status}
}

export function linkSaveInProgress(link) {
  return {type: 'LINK_SAVE_IN_PROGRESS', link}
}
