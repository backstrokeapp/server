import collectionLinksError from './error';
import collectionLinksPush from './push';
import { API_URL } from '../../../constants';

export default function collectionLinksCreate() {
  return dispatch => {
    return fetch(`${API_URL}/v1/links`, {
      method: 'POST',
      credentials: 'include',
    }).then(r => r).catch(err => {
      dispatch(collectionLinksError(`Couldn't create link: ${err.message}`));
    }).then(resp => {
      if (resp && resp.ok) {
        return resp.json().then(item => {
          dispatch(collectionLinksPush(item));
          return item;
        });
      } else if (resp) {
        return resp.json().then(data => {
          dispatch(collectionLinksError(`Error creating link: ${data.error}`));
          return null;
        });
      }
    });
  };
}
