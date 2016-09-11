import {push} from 'react-router-redux';

export default function moveToLink(link) {
  return dispatch => {
    dispatch({type: 'MOVE_TO_LINK', link});
    dispatch(push(`/links/${link}`));
  };
}
