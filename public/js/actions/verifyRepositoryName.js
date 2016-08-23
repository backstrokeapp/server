import 'whatwg-fetch';

export default function verifyRepositoryName(repo, name) {
  return dispatch => {
    if (repo.provider === 'github') {
      dispatch(repoName(repo, name));
      return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/repos/${repo.provider}/${name}/branches`)
      .then(response => {
        if (response.status < 400) {
          return response.json().then(({branches}) => {
            return dispatch(repoValid(Object.assign({}, repo, {name}), branches));
          });
        } else {
          dispatch(repoInvalid(Object.assign({}, repo, {name})));
        }
      });
    }
  };
}

export function repoValid(data, branches) {
  return {type: 'REPO_VALID', data, branches};
}
export function repoInvalid(data) {
  return {type: 'REPO_INVALID', data};
}
export function repoName(data, name) {
  return {type: 'REPO_NAME', data, name};
}
