import 'whatwg-fetch';

export default function enableDisableLink(link, enabled) {
  return dispatch => {
    dispatch(enableDisableLinkPending(link));
    return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/link/${link._id}/enable`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({enabled}),
      credentials: 'include',
    }).then(response => response.json()).then(json => {
      dispatch(enableDisableLinkAction(link, enabled));
    });
  };
}

export function enableDisableLinkAction(link, enabled) {
  return {
    type: 'ENABLE_DISABLE_LINK',
    link: link._id,
    enabled,
  };
}

export function enableDisableLinkPending(link) {
  return {
    type: 'ENABLE_DISABLE_LINK_PENDING',
    link: link._id,
  };
}
