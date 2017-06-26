import collectionLinksError from './error';
import collectionLinksPush from './push';

export default function collectionLinksCreate() {
  return dispatch => {
    return fetch(`https://api.backstroke.us/v1/links`, {
      method: 'POST',
      credentials: 'include',
    }).then(r => r).catch(err => {
      dispatch(collectionLinksError(err));
    }).then(resp => {
      if (resp.ok) {
        return resp.json().then(item => {
          dispatch(collectionLinksPush(item));
          return item;
        });
      } else {
        return resp.json().then(data => {
          dispatch(collectionLinksError(`Error creating link: ${data.error}`));
          return null;
        });
      }
    });
  };
}
