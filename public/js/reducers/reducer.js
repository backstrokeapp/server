import {combineReducers} from 'redux';
import user from 'reducers/user';
import activeRepository from 'reducers/activeRepository';
import repositoryList from 'reducers/repositoryList';
import {routerReducer as routing} from 'react-router-redux';

const reducers = combineReducers({
  activeRepository, // the repository that is currently selected
  user, // logged in user
  repositoryList, // minimal repo info

  routing,
});

export default reducers;
