import collectionLinksError from './error';
import { API_URL } from '../../../constants';

export const COLLECTION_LINKS_DELETE = 'COLLECTION_LINKS_DELETE';

export default function collectionLinksDelete(link) {
  return dispatch => {
    return fetch(`${API_URL}/v1/links/${link.id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(r => r).catch(err => {
      dispatch(collectionLinksError(`Couldn't delete link: ${err.message}`));
    }).then(resp => {
      if (resp && resp.ok) {
        return resp.json().then(item => {
          dispatch({ type: COLLECTION_LINKS_DELETE, item: link });
        });
      } else if (resp) {
        return resp.json().then(data => {
          dispatch(collectionLinksError(`Error deleting link: ${data.error}`));
        });
      }
    });
  };
}
