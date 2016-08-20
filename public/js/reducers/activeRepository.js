export default function activeRepository(store=null, action) {
  switch (action.type) {
    case 'REPO_INFO':
      return action.data;
    default:
      return store;
  }
}
