import collectionLinksError from './error';
import collectionLinksPush from './push';
import { API_URL } from '../../../constants';

export default function collectionLinksEnable(link) {
  const desiredEnabledState = !link.enabled;
  return dispatch => {
    return fetch(`${API_URL}/v1/links/${link.id}/enable`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        enabled: desiredEnabledState,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }).then(r => r).catch(err => {
      dispatch(collectionLinksError(`Couldn't enable link: ${err.message}`));
    }).then(resp => {
      if (resp && resp.ok) {
        return resp.json().then(item => {
          dispatch(collectionLinksPush({...link, enabled: desiredEnabledState}));
        });
      } else if (resp) {
        return resp.json().then(data => {
          dispatch(collectionLinksError(`Error enabling link: ${data.error}`));
        });
      }
    });
  };
}
