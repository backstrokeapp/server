import collectionLinksError from './error';
import collectionLinksSet from './set';

export const COLLECTION_LINKS_FETCH = 'COLLECTION_LINKS_FETCH';

export default function collectionLinksFetch() {
  return dispatch => {
    return fetch('https://api.backstroke.us/v1/links', {
      credentials: 'include',
    }).then(r => r).catch(err => {
      dispatch(collectionLinksError(err));
    }).then(resp => {
      if (resp.ok) {
        return resp.json().then(({data, page}) => {
          dispatch(collectionLinksSet(data, page));
        });
      } else {
        return resp.text().then(data => {
          dispatch(collectionLinksError(`Request error: ${data}`));
        });
      }
    });
  };
}
