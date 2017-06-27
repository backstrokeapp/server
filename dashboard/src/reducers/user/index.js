import { USER_SET } from '../../actions/user/set';
const initialState = null;

export default function user(state=initialState, action) {
  switch (action.type) {
  case USER_SET:
    return action.data;
  default:
    return state;
  }
}
