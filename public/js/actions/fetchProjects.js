import 'whatwg-fetch';

export default function fetchProjects(provider, user, repo) {
  return dispatch => {
    return fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/repos`)
    .then(response => response.json())
    .then(json => {
      dispatch(projectsInfo(json));
    });
  };
}

export function projectsInfo(data) {
  return {type: 'PROJECTS_INFO', data};
}
