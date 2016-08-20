import {combineReducers} from 'redux';
import user from 'reducers/user';
import activeRepository from 'reducers/activeRepository';

const reducers = combineReducers({
  activeRepository, // the repository that is currently selected
  user, // logged in user
  repositoryList: s => [{user: "1egoman", repo: "my-cool-repo"}], // minimal repo info
});

export default reducers;
