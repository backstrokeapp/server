export default function repositoryList(state=null, action) {
  switch (action.type) {
    case 'PROJECTS_INFO':
      return action.data;

    case 'ENABLE_DISABLE_REPOSITORY':
      return Object.assign({}, state, {
        data: state.data.map(item => {
          if (item._id === action.repo) {
            return Object.assign({}, item, {enabled: action.enabled, _pending: false});
          } else {
            return item;
          }
        }),
      });

    case 'ENABLE_DISABLE_REPOSITORY_PENDING':
      return Object.assign({}, state, {
        data: state.data.map(item => {
          if (item._id === action.repo) {
            return Object.assign({}, item, {_pending: true});
          } else {
            return item;
          }
        }),
      });

    default:
      return state;
  }
}
