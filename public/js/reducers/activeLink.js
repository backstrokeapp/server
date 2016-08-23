// if `data` is one of the repos represented, update it
function updateRepo(state, data, cb) {
  if (state.to.provider === data.provider && state.to.name === data.name) {
    return Object.assign({}, state, {to: cb(state.to)});
  } else if (state.from.provider === data.provider && state.from.name === data.name) {
    return Object.assign({}, state, {from: cb(state.from)});
  } else {
    return state;
  }
}

export default function activeLink(state=null, action) {
  switch (action.type) {
    case 'LINK_INFO':
      return action.data;

    case 'REPO_NAME':
      return updateRepo(state, action.data, repo => {
        return Object.assign({}, repo, {name: action.name});
      });

    case 'REPO_VALID':
      return updateRepo(state, action.data, repo => {
        return Object.assign({}, repo, {
          name: action.name,
          branches: action.branches, // branches come back in the validation
          _nameValid: true,
        });
      });

    case 'REPO_INVALID':
      return updateRepo(state, action.data, repo => {
        return Object.assign({}, repo, {
          name: action.name,
          _nameValid: false,
        });
      });

    case 'REPO_BRANCH':
      return updateRepo(state, action.data, repo => {
        return Object.assign({}, repo, {branch: action.branch});
      });

    case 'LINK_SAVE_IN_PROGRESS':
      return Object.assign({}, state, {
        _saveInProgress: true,
      });

    case 'LINK_SAVE':
      return Object.assign({}, state, {
        _saveInProgress: false,
        _saveStatus: action.status,
      });

    default:
      return state;
  }
}
