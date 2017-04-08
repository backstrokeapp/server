import 'whatwg-fetch';
import {push} from 'react-router-redux';

export default function enableDisableLink(link, enabled) {
  return dispatch => {
    dispatch(enableDisableLinkPending(link));
    return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/link/${link.id}/enable`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({enabled}),
      credentials: 'include',
    }).then(response => response.json()).then(json => {
      if (json.status === 'ok') {
        dispatch(enableDisableLinkAction(link, enabled));
      } else if (json.error && (
        json.error.indexOf('paid') !== -1 ||
        json.error.indexOf('private') !== -1
      )) {
        // redirect to payments page
        dispatch(push('/settings'));
      } else {
        dispatch(enableDisableLinkAction(link, !enabled)); // don't change the state
      }
    });
  };
}

export function enableDisableLinkAction(link, enabled) {
  return {
    type: 'ENABLE_DISABLE_LINK',
    link: link.id,
    enabled,
  };
}

export function enableDisableLinkPending(link) {
  return {
    type: 'ENABLE_DISABLE_LINK_PENDING',
    link: link.id,
  };
}
