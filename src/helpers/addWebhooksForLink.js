import createGithubInstance from '../createGithubInstance';
import Promise from 'bluebird';
import Debug from 'debug';
const debug = Debug('backstroke:webhook:add-or-remove');

export function getBackstrokeUrlFor(link) {
  let hostname = process.env.BACKSTROKE_SERVER || 'http://backstroke.us';
  return `${hostname}/_${link.id}`;
}

function addWebhookToRepo(gh, config, user, owner, repo) {
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
  debug('WEBHOOK CONFIG TO POST TO GITHUB %o FOR LINK %o', config, link);

  let operations = [];

  if (link && link.upstream && link.upstream.type === 'repo') {
    operations.push(addWebhookToRepo(gh, config, user, link.upstream.owner, link.upstream.repo));
  }
  if (link && link.fork && link.fork.type === 'repo') {
    operations.push(addWebhookToRepo(gh, config, user, link.fork.owner, link.fork.repo));
  }
  debug('WEBHOOK ADD TO HOW MANY REPOS %d', operations.length);

  return Promise.all(operations).then(results => {
    let errors = results.filter(r => r && r.error);
    debug('WEBHOOK ADD RESULTS %o', results);

    // If at least one webhook was successfully added, then succeed.
    if (errors.length === 0 || results.length - errors.length > 0) {
      return results.filter(i => i.id).map(i => i.id.toString());
    } else {
      return Promise.reject(errors[0]);
    }
  });
}

// Given a link, remove all webhooks stored in the `hookId` property.
export function removeOldWebhooksForLink(user, link) {
  let gh = createGithubInstance(user);

  if (link.upstream.type === 'repo' && link.hookId) {
    let all = link.hookId.map(id => {
      debug('DELETING WEBHOOK %s on %s/%s', id, link.upstream.owner, link.upstream.fork);
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
