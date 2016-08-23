import 'whatwg-fetch';

export default function linkSave(link) {
  return dispatch => {
    dispatch(linkSaveInProgress(link));
    fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/links/${link._id}`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({link}),
    }).then(response => response.json()).then(json => {
      dispatch(linkSaveAction(link, json.status));
    });
  };
}

export function linkSaveAction(link, status) {
  return {type: 'LINK_SAVE', link, status}
}

export function linkSaveInProgress(link) {
  return {type: 'LINK_SAVE_IN_PROGRESS', link}
}
