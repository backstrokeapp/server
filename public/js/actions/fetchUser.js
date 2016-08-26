import 'whatwg-fetch';

export default function fetchUser() {
  return dispatch => {
    return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/whoami`, {
      credentials: 'include',
    })
    .then(response => response.json())
    .then(json => {
      dispatch(userInfo(json));
    });
  };
}

export function userInfo(user) {
  return {type: 'USER_INFO', user};
}
