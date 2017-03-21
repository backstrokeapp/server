import createGithubInstance from '../createGithubInstance';
import getRepoName from 'helpers/getRepoName';
import Promise from 'bluebird';

export function getBackstrokeUrlFor(link) {
  let hostname = process.env.BACKSTROKE_SERVER || 'http://backstroke.us';
  return `${hostname}/_${link.id}`;
}

function addWebhookToRepo(gh, config, user, owner, repo) {
  console.log(owner, repo);
  return gh.reposCreateHook({
    owner,
    repo,
    config,
    name: 'web',
    events: ['push'],
  }).catch(err => {
    if (err.code === 422) { // The webhook already exists
      return false;
    } else if (err.code === 404) { // No permission to add a webhook to this repo
      return {
        error: [
          `No permission to add a webhook to the repository ${owner}/${repo}.`,
          `Make sure ${user.user} has given Backstroke permission to access this organisation or`,
          `repo via OAuth.`,
        ].join(' '),
      };
    } else {
      return Promise.reject(err);
    }
  });
}

// Given a link, try to add a webhook within the parent repository.
export function addWebhooksForLink(user, link) {
  let gh = createGithubInstance(user);
  let config = {
    url: getBackstrokeUrlFor(link),
    content_type: 'json',
  };
  console.log('WEBHOOK CONFIG', link, config);

  let operations = [];

  if (link && link.upstream && link.upstream.type === 'repo') {
    let [fromUser, fromRepo] = getRepoName(link.upstream);
    operations.push(addWebhookToRepo(gh, config, user, fromUser, fromRepo));
  }
  if (link && link.fork && link.fork.type === 'repo') {
    let [toUser, toRepo] = getRepoName(link.fork);
    operations.push(addWebhookToRepo(gh, config, user, toUser, toRepo));
  }
  console.log('WEBHOOK OPS', operations);

  return Promise.all(operations).then(results => {
    let errors = results.filter(r => r && r.error);
    console.log('ADD WEBHOOK', results);

    // If at least one webhook was successfully added, then succeed.
    if (errors.length === 0 || results.length - errors.length > 0) {
      return results.filter(i => i).map(i => i.id.toString());
    } else {
      return Promise.reject(errors[0]);
    }
  });
}

// Given a link, remove all webhooks stored in the `hookId` property.
export function removeOldWebhooksForLink(user, link) {
  let gh = createGithubInstance(user);

  if (link.upstream.type === 'repo' && link.hookId) {
    let [fromUser, fromRepo] = getRepoName(link.upstream);

    console.log('LINK', link);

    let all = link.hookId.map(id => {
      console.log('DELETING HOOK', id);
      return gh.reposDeleteHook({owner: fromUser, repo: fromRepo, id}).catch(err => {
        if (err.status === 'Not Found') {
          return true; // The given webhook was deleted by the user.
        } else {
          throw err; // rethrow error
        }
      });
    });
    return Promise.all(all);
  } else {
    return Promise.resolve(true); // no webhook to remove
  }
}
