import 'whatwg-fetch';

export default function verifyRepositoryName(repo, name) {
  return dispatch => {
    if (repo.provider === 'github') {
      dispatch(repoName(repo, name));
      let nameUpdatedRepo = Object.assign({}, repo, {name});

      // if there isn't a slash, its not worth searching. Also, if there isn't a char after the
      // slash then also don't search
      if (name.indexOf('/') > 0 && name[name.length-1] !== '/') {
        return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/repos/${repo.provider}/${name}`, {
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
    }
  };
}

export function repoValid(data, branches, _private, fork) {
  return {type: 'REPO_VALID', data, branches, private: _private, fork};
}
export function repoInvalid(data) {
  return {type: 'REPO_INVALID', data};
}
export function repoName(data, name) {
  return {type: 'REPO_NAME', data, name};
}
