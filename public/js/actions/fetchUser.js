import 'whatwg-fetch';

export default function fetchUser() {
  return dispatch => {
    console.log(process.env.BACKSTROKE_SERVER)
    return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/whoami`)
    .then(response => response.json())
    .then(json => {
      dispatch(userInfo(json));
    });
  };
}

export function userInfo(user) {
  return {type: 'USER_INFO', user};
}
