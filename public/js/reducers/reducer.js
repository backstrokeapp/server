import {combineReducers} from 'redux';
import user from 'reducers/user';
// import activeRepository from 'reducers/repository';

const reducers = combineReducers({
  activeRepository: s => 123, // the current repository
  user, // logged in user
  repositoryList: s => [{user: "1egoman", repo: "my-cool-repo"}], // minimal repo info
});

export default reducers;
