import 'whatwg-fetch';

export default function verifyRepositoryName(repo, owner, name) {
  return dispatch => {
    dispatch(repoName(repo, owner, name));
    let nameUpdatedRepo = Object.assign({}, repo, {owner, repo: name});

    // If both the owner and repo name are set, then search. 
    if (owner && name && owner.length > 0 && name.length > 0) {
      return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/repos/github/${owner}/${name}`, {
        credentials: 'include',
      }).then(response => {
        if (response.status < 400) {
          return response.json().then(({branches, private: _private, fork}) => {
            return dispatch(repoValid(nameUpdatedRepo, branches, _private, fork));
          });
        } else {
          dispatch(repoInvalid(nameUpdatedRepo));
        }
      });
    }
  };
}

export function repoValid(data, branches, _private, fork) {
  return {type: 'REPO_VALID', data, branches, private: _private, fork};
}
export function repoInvalid(data) {
  return {type: 'REPO_INVALID', data};
}
export function repoName(data, owner, repo) {
  return {type: 'REPO_NAME', data, owner, repo};
}
