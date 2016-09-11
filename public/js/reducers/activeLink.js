// if `data` is one of the repos represented, update it
function updateRepo(state, data, cb) {
  if (state.to && state.to.provider === data.provider && state.to.name === data.name) {
    return Object.assign({}, state, {to: cb(state.to)});
  } else if (state.from && state.from.provider === data.provider && state.from.name === data.name) {
    return Object.assign({}, state, {from: cb(state.from)});
  } else {
    return state;
  }
}

export default function activeLink(state=null, action) {
  switch (action.type) {
    case 'NEW_LINK':
      return action.data;

    case 'LINK_INFO':
      // Validate each name when it comes from the server
      action.data.to._nameValid = true;
      action.data.from._nameValid = true;
      return action.data;

    // When moving to a new link, clear the old one.
    // Well, only clear if we're moving to a different link then we were on previously.
    case 'MOVE_TO_LINK':
      if (state && state._id !== action.link) {
        return null;
      } else {
        return state;
      }

    // enable or disable a link
    case 'ENABLE_DISABLE_LINK':
      return Object.assign({}, state, {enabled: action.enabled, _pending: false});

    case 'ENABLE_DISABLE_LINK_PENDING':
      return Object.assign({}, state, {_pending: true});

    case 'REPO_NAME':
      return updateRepo(state, action.data, repo => {
        return Object.assign({}, repo, {name: action.name});
      });

    case 'REPO_VALID':
      return updateRepo(state, action.data, repo => {
        return Object.assign({}, repo, {
          branches: action.branches, // branches come back in the validation
          private: action.private,
          fork: action.fork,
          _nameValid: true,
        });
      });

    case 'REPO_INVALID':
      return updateRepo(state, action.data, repo => {
        return Object.assign({}, repo, {
          _nameValid: false,
          branches: [],
        });
      });

    case 'REPO_BRANCH':
      return updateRepo(state, action.data, repo => {
        return Object.assign({}, repo, {branch: action.branch});
      });

    case 'LINK_SAVE_IN_PROGRESS':
      return Object.assign({}, state, {
        _saveInProgress: true,
        _saveError: false,
      });

    case 'LINK_SAVE':
      return Object.assign({}, state, {
        _saveInProgress: false,
        _saveStatus: action.status,
        _saveError: false,
      });

    case 'LINK_SAVE_ERROR':
      return Object.assign({}, state, {
        _saveInProgress: false,
        _saveError: action.error,
      });

    // Delete a repo
    case 'IS_DELETING_REPO':
      return updateRepo(state, action.data, repo => {
        return Object.assign({}, repo, {_deleting: true});
      });

    case 'DELETE_REPO':
      return updateRepo(state, action.data, repo => {
        return null;
      });

    case 'CANCEL_REPO_DELETE':
      return updateRepo(state, action.data, repo => {
        return Object.assign({}, repo, {_deleting: false});
      });

    // Delete a link
    case 'IS_DELETING_ACTIVE_LINK':
      return Object.assign({}, state, {_deleting: true});
    case 'CANCEL_ACTIVE_LINK_DELETE':
      return Object.assign({}, state, {_deleting: false});
    case 'DELETE_LINK':
      return null;

    // Add a new repo / all forks / box / etc
    case 'ADD_NEW_REPOSITORY':
      return Object.assign({}, state, {
        [action.slot]: {
          type: 'repo',
          name: '',
          provider: 'github',
          branches: [],
        },
      });

    case 'ADD_ALL_FORKS':
      if (action.slot === 'to') {
        return Object.assign({}, state, {
          [action.slot]: {
            type: 'fork-all',
            provider: 'github',
          },
        });
      } else {
        return state;
      }

    case 'CHANGE_LINK_NAME':
      return Object.assign({}, state, {name: action.content});

    case 'CHANGE_PUSH_USERS':
      return Object.assign({}, state, {pushUsers: action.users});

    default:
      return state;
  }
}
