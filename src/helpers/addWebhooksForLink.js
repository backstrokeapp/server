import createGithubInstance from '../createGithubInstance';
import getRepoName from 'helpers/getRepoName';

export function getBackstrokeUrlFor(link) {
  return `http://backstroke.us/_${link._id}`;
}

// Given a link, try to add a webhook to all the repos it contains.
export default function addWebhooksForLink(user, link) {
  let gh = createGithubInstance(user);
  console.log(1)

  function createWebhook(user, repo, config) {
    return gh.reposCreateHook({
      user,
      repo,
      config,
      name: 'Backstroke',
      events: ['push'],
    });
  }

  let config = {
    url: getBackstrokeUrlFor(link),
    content_type: 'json',
  };
  console.log(2)

  // try to add a hook to all repos within the link
  let hooks = [];
  if (link.to.type === 'repo') {
    let [user, repo] = getRepoName(link.to);
    hooks.push(createWebhook(user, repo, config));
  }
  console.log(3)

  console.log(4, link.from)
  if (link.from.type === 'repo') {
    let [user, repo] = getRepoName(link.from);
    hooks.push(createWebhook(user, repo, config));
  }

  return Promise.all(hooks);
}
