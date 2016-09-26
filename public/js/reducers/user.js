export default function user(store=null, action) {
  switch (action.type) {
    case 'USER_INFO':
      action.user._auth = true;
      return action.user;
    case 'USER_NOT_AUTHENTICATED':
      return {
        _auth: false,
      };
    default:
      return store;
  }
}
