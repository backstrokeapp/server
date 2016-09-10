import createGithubInstance from '../createGithubInstance';
import getRepoName from 'helpers/getRepoName';
import Promise from 'bluebird';

export function getBackstrokeUrlFor(link) {
  return `http://backstroke.us/_${link._id}`;
}

// Given a link, try to add a webhook within the parent repository.
export default function addWebhooksForLink(user, link) {
  let gh = createGithubInstance(user);
  let config = {
    url: getBackstrokeUrlFor(link),
    content_type: 'json',
  };

  if (link.from.type === 'repo') {
    let [user, repo] = getRepoName(link.from);
    return gh.reposCreateHook({
      user,
      repo,
      config,
      name: 'web',
      events: ['push'],
    }).catch(err => {
      if (err.code === 422) { // The webhook already exists
        return false;
      } else if (err.code === 404) { // No permission to add a webhook
        return {error: 'No permission to add a webhook to the repository.'};
      } else {
        return Promise.reject(err);
      }
    });
  } else {
    return Promise.resolve(true); // no webhook to add
  }
}
