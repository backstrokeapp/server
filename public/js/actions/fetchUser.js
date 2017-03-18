import 'whatwg-fetch';

export default function fetchUser() {
  return dispatch => {
    return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/whoami`, {
      credentials: 'include',
    })
    .then(response => response.json())
    .then(json => {
      if (json.error) {
        dispatch(userNotAuthenticated());
      } else {
        dispatch(userInfo(json));
      }
    }).catch(err => {
      dispatch(userNotAuthenticated());
    });
  };
}

export function userInfo(user) {
  if (process.env.USE_MIXPANEL && user.id) {
    mixpanel.identify(user.id);
    mixpanel.people.set({
      "$email": user.email,
      "$first_name": user.user,
      "have_payment": user.customerId ? true : false,
      "are_paying": user.subscriptionId ? true : false,
    });
  }
  return {type: 'USER_INFO', user};
}
export function userNotAuthenticated() {
  return {type: 'USER_NOT_AUTHENTICATED'};
}
