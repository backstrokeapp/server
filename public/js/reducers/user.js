export default function user(store=null, action) {
  switch (action.type) {
    case 'USER_INFO':
      return action.user;
    default:
      return store;
  }
}
