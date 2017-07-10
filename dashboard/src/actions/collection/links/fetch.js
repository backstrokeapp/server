import collectionLinksError from './error';
import collectionLinksSet from './set';
import { API_URL } from '../../../constants';

export const COLLECTION_LINKS_FETCH = 'COLLECTION_LINKS_FETCH';

export default function collectionLinksFetch() {
  return dispatch => {
    return fetch(`${API_URL}/v1/links`, {
      credentials: 'include',
    }).then(r => r).catch(err => {
      dispatch(collectionLinksError(`Couldn't fetch link collection: ${err.message}`));
    }).then(resp => {
      if (resp && resp.ok) {
        return resp.json().then(({data, page}) => {
          dispatch(collectionLinksSet(data, page));
        });
      } else if (resp) {
        return resp.text().then(data => {
          dispatch(collectionLinksError(`Error fetching links: ${data}`));
        });
      }
    });
  };
}
