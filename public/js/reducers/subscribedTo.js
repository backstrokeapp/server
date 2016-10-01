export default function subscribedTo(state=null, action) {
  switch (action.type) {
    case 'USER_SUBSCRIBES_TO':
      return action.data;

    default:
      return state;
  }
}
