export default function linkList(state=null, action) {
  switch (action.type) {
    case 'LINKS_INFO':
      return action.data;

    case 'ENABLE_DISABLE_LINK':
      return Object.assign({}, state, {
        data: state.data.map(item => {
          if (item._id === action.link) {
            return Object.assign({}, item, {enabled: action.enabled, _pending: false});
          } else {
            return item;
          }
        }),
      });

    case 'ENABLE_DISABLE_LINK_PENDING':
      return Object.assign({}, state, {
        data: state.data.map(item => {
          if (item._id === action.link) {
            return Object.assign({}, item, {_pending: true});
          } else {
            return item;
          }
        }),
      });

    case 'DELETE_LINK':
      return Object.assign({}, state, {
        data: state.data.filter(item => {
          return item._id !== action.link;
        }),
      });

    default:
      return state;
  }
}
