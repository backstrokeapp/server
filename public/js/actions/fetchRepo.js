import 'whatwg-fetch';

export default function fetchRepo(provider, user, repo) {
  return dispatch => {
    return fetch(`/api/v1/repos/${provider}/${user}/${repo}`)
    .then(response => response.json())
    .then(json => {
      dispatch(repoInfo(provider, user, repo, json));
    });
  };
}

export function repoInfo(provider, user, repo, data) {
  return {type: 'REPO_INFO', provider, user, repo, data};
}
