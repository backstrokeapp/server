import 'whatwg-fetch';

export default function fetchSettings() {
  return dispatch => {
    return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/subscribed`, {
      credentials: 'include',
    })
    .then(response => response.json())
    .then(json => {
      if (json.error) {
        dispatch(userSubscribedTo(null)); // public plan
      } else {
        dispatch(userSubscribedTo(json));
      }
    }).catch(err => {
      dispatch(userSubscribedTo(null)); // FIXME: dispatch an error of some sort?
    });
  };
}


export function userSubscribedTo(data) {
  return {type: 'USER_SUBSCRIBES_TO', data};
}
