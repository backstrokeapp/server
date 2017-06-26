import { COLLECTION_LINKS_SET } from '../../actions/collection/links/set';
import { COLLECTION_LINKS_SELECT } from '../../actions/collection/links/select';
import { COLLECTION_LINKS_ERROR } from '../../actions/collection/links/error';
import { COLLECTION_LINKS_START_LOADING } from '../../actions/collection/links/start-loading';
import { COLLECTION_LINKS_PUSH } from '../../actions/collection/links/push';
import { COLLECTION_LINKS_DELETE } from '../../actions/collection/links/delete';
import { ROUTE_TRANSITION_LINK_DETAIL } from '../../actions/route-transition/link-detail';

const initialState = {
  selected: null,
  loading: true,
  data: [],
  error: null,
  page: 0,
};

export default function links(state=initialState, action) {
  switch (action.type) {
  case ROUTE_TRANSITION_LINK_DETAIL:
    return {...state, selected: action.id};
  case COLLECTION_LINKS_START_LOADING:
    return {...state, loading: true};
  case COLLECTION_LINKS_ERROR:
    return {...state, error: action.error};
  case COLLECTION_LINKS_SET:
    return {...state,
      data: action.data.map(item => {
        if (!item.upstream) {
          item.upstream = { type: 'repo', branches: [] };
        }
        if (!item.fork) {
          item.fork = { type: 'fork-all' };
        }
        return item;
      }),
      loading: false,
      page: action.page || 0,
    };
  case COLLECTION_LINKS_SELECT:
    return {...state, selected: action.id};
  case COLLECTION_LINKS_PUSH:
    const dataInState = state.data.find(item => action.item.id === item.id);
    return {
      ...state,
      data: state.data.map(item => {
        // Update any old items.
        if (action.item.id === item.id) {
          return action.item;
        } else {
          return item;
        }
      }).concat(
        // Add the item if it's new.
        dataInState ? [] : [action.item]
      ),
    };
  case COLLECTION_LINKS_DELETE:
    return {
      ...state,
      data: state.data.filter(item => {
        return action.item.id !== item.id;
      }),
    };
  default:
    return state;
  }
}
