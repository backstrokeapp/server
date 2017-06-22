import collectionLinksFetch from '../collection/links/fetch';

export const ROUTE_TRANSITION_LINK_LIST = 'ROUTE_TRANSITION_LINK_LIST';

export default function routeTransitionLinkList() {
  return dispatch => {
    dispatch({ type: ROUTE_TRANSITION_LINK_LIST });
    dispatch(collectionLinksFetch());
  };
}
