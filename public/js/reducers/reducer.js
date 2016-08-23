import {combineReducers} from 'redux';
import user from 'reducers/user';
import activeLink from 'reducers/activeLink';
import linkList from 'reducers/linkList';
import {routerReducer as routing} from 'react-router-redux';

const reducers = combineReducers({
  activeLink, // the link that is currently selected
  user, // logged in user
  linkList, // minimal link info

  routing,
});

export default reducers;
