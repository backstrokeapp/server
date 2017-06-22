import { ROUTE_TRANSITION_LINK_LIST } from '../../actions/route-transition/link-list';
import { ROUTE_TRANSITION_LINK_DETAIL } from '../../actions/route-transition/link-detail';

const initialState = null;

export default function activePage(state=initialState, action) {
  switch (action.type) {
  case ROUTE_TRANSITION_LINK_LIST:
    return 'link-list';
  case ROUTE_TRANSITION_LINK_DETAIL:
    return 'link-detail';
  default:
    return state;
  }
}
