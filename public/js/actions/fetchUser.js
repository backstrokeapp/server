import 'whatwg-fetch';

export default function fetchUser() {
  return dispatch => {
    return fetch('/api/v1/whoami')
    .then(response => response.json())
    .then(json => {
      dispatch(userInfo(json));
    });
  };
}

export function userInfo(user) {
  return {type: 'USER_INFO', user};
}
