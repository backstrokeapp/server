import createGithubInstance from '../createGithubInstance';
import getRepoName from 'helpers/getRepoName';
import Promise from 'bluebird';

export function getBackstrokeUrlFor(link) {
  let hostname = process.env.BACKSTROKE_SERVER || 'http://backstroke.us';
  return `${hostname}/_${link._id}`;
}

// Given a link, try to add a webhook within the parent repository.
export function addWebhooksForLink(user, link) {
  let gh = createGithubInstance(user);
  let config = {
    url: getBackstrokeUrlFor(link),
    content_type: 'json',
  };
  let webhooks = [];

  function webhookWrapper(webhook) {
    return webhook.catch(err => {
      if (err.code === 422) {
        return false;
      } else {
        return Promise.reject(err);
      }
    });
  }

  if (link.from.type === 'repo') {
    let [fromUser, fromRepo] = getRepoName(link.from);
    webhooks.push(webhookWrapper(gh.reposCreateHook({
      user: fromUser,
      repo: fromRepo,
      config,
      name: 'web',
      events: ['push'],
    })));
  } 

  if (link.to.type === 'repo') {
    let [toUser, toRepo] = getRepoName(link.to);
    webhooks.push(webhookWrapper(gh.reposCreateHook({
      user: toUser,
      repo: toRepo,
      config,
      name: 'web',
      events: ['push'],
    })));
  }

  if (webhooks.length > 0) {
    // Create at least one webhook, first try on the upstream, then try on the child.
    return Promise.some(webhooks, 1).catch(err => {
      if (err.code === 404) { // No permission to add a webhook
        return {
          error: [
            `No permission to add a webhook to the repository ${fromUser}/${fromRepo}.`,
            `Make sure ${user.user} has given Backstroke permission to access this organisation or`,
            `repo via OAuth.`,
          ].join(' '),
        };
      } else {
        return Promise.reject(err);
      }
    });
  } else {
    return Promise.resolve(true); // no webhook to add
  }

}

export function removeOldWebhooksForLink(user, link) {
  let gh = createGithubInstance(user);

  if (link.from.type === 'repo' && link.hookId) {
    let [fromUser, fromRepo] = getRepoName(link.from);
    return gh.reposDeleteHook({
      user: fromUser,
      repo: fromRepo,
      id: link.hookId,
    }).catch(err => {
      if (err.status === 'Not Found') {
        return true; // The given webhook was deleted by the user.
      } else {
        throw err; // rethrow error
      }
    })
  } else {
    return Promise.resolve(true); // no webhook to remove
  }
}
