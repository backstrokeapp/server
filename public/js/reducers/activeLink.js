export default function activeLink(store=null, action) {
  switch (action.type) {
    case 'LINK_INFO':
      return action.data;
    default:
      return store;
  }
}
