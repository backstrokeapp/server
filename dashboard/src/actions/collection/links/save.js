import collectionLinksError from './error';
import collectionLinksPush from './push';
import { API_URL } from '../../../constants';

export default function collectionLinksSave(link) {
  return dispatch => {
    return fetch(`${API_URL}/v1/links/${link.id}`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({link}),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(r => r).catch(err => {
      dispatch(collectionLinksError(err));
    }).then(resp => {
      if (resp.ok) {
        return resp.json().then(item => {
          dispatch(collectionLinksPush(link));
          return true;
        });
      } else {
        return resp.json().then(data => {
          dispatch(collectionLinksError(`Error saving link: ${data.error}`));
          return false;
        });
      }
    });
  };
}
