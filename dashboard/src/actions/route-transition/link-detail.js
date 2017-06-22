import collectionLinksFetch from '../collection/links/fetch';

export const ROUTE_TRANSITION_LINK_DETAIL = 'ROUTE_TRANSITION_LINK_DETAIL';

export default function routeTransitionLinkDetail() {
  return dispatch => {
    dispatch({ type: ROUTE_TRANSITION_LINK_DETAIL });
    dispatch(collectionLinksFetch());
  };
}
