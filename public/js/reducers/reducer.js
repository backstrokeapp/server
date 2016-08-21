import {combineReducers} from 'redux';
import user from 'reducers/user';
import activeRepository from 'reducers/activeRepository';
import repositoryList from 'reducers/repositoryList';

const reducers = combineReducers({
  activeRepository, // the repository that is currently selected
  user, // logged in user
  repositoryList, // minimal repo info
});

export default reducers;
