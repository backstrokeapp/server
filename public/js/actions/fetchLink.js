import 'whatwg-fetch';

export default function fetchLink(link) {
  return dispatch => {
    return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/links/${link._id}`)
    .then(response => response.json())
    .then(json => {
      dispatch(linkInfo(json));
    });
  };
}

export function linkInfo(data) {
  return {type: 'LINK_INFO', data};
}
