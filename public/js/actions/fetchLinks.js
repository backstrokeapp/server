import 'whatwg-fetch';

export default function fetchLinks(provider, user, repo) {
  return dispatch => {
    return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/links`)
    .then(response => response.json())
    .then(json => {
      dispatch(linkInfo(json));
    });
  };
}

export function linkInfo(data) {
  return {type: 'LINKS_INFO', data};
}
