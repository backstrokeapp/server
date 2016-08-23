import 'whatwg-fetch';

export default function enableDisableRepository({_id, provider, name}, enabled) {
  let [user, repo] = name.split('/');
  return dispatch => {
    dispatch(enableDisableRepositoryPending({_id}));
    return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/repos/${provider}/${user}/${repo}/enable`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({enabled}),
    }).then(response => response.json()).then(json => {
      dispatch(enableDisableRepositoryAction({_id}, enabled));
    });
  };
}

export function enableDisableRepositoryAction(repo, enabled) {
  return {
    type: 'ENABLE_DISABLE_REPOSITORY',
    repo: repo._id,
    enabled,
  };
}

export function enableDisableRepositoryPending(repo) {
  return {
    type: 'ENABLE_DISABLE_REPOSITORY_PENDING',
    repo: repo._id,
  };
}
