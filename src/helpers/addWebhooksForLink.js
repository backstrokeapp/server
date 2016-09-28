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

  let [fromUser, fromRepo] = getRepoName(link.from);
  let [toUser, toRepo] = getRepoName(link.to);

  if (link.from.type === 'repo') {
    webhooks.push(gh.reposCreateHook({
      user: fromUser,
      repo: fromRepo,
      config,
      name: 'web',
      events: ['push'],
    }));
  } 

  if (link.to.type === 'repo') {
    webhooks.push(gh.reposCreateHook({
      user: toUser,
      repo: toRepo,
      config,
      name: 'web',
      events: ['push'],
    }));
  }

  if (webhooks.length > 0) {
    // Create at least one webhook, first try on the upstream, then try on the child.
    return Promise.some(webhooks, 1).catch(Promise.AggregateError, err => {
      // Adding both wehhooks failed
      return {
        error: [
          `No permission to add a webhook to either ${toUser}/${toRepo} and ${fromUser}/${fromRepo}`,
          `Make sure ${user.user} has given Backstroke permission to access to at least one of those`,
          `repos via OAuth.`,
        ].join(' '),
      };
    }).catch(err => {
      if (err.code === 404) {
        // No permission to add a webhook
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
  let config = {
    url: getBackstrokeUrlFor(link),
    content_type: 'json',
  };
  let webhooks = [];

  if (link.from.type === 'repo') {
    let [fromUser, fromRepo] = getRepoName(link.from);
    webhooks.push(gh.reposDeleteHook({
      user: fromUser,
      repo: fromRepo,
      id: link.hookId,
    }));
  } 

  if (link.to.type === 'repo') {
    let [toUser, toRepo] = getRepoName(link.to);
    webhooks.push(gh.reposDeleteHook({
      user: toUser,
      repo: toRepo,
      id: link.hookId,
    }));
  }

  if (webhooks.length > 0) {
    // Delete the specific hook.
    return Promise.some(webhooks, 1).catch(Promise.AggregateError, err => {
      // Deleting both hooks failed, probably because the hook id was invalid.
      return false;
    }).catch(err => {
      if (err.status === 'Not Found') {
        return true; // The given webhook was deleted by the user.
      } else {
        throw err; // rethrow error
      }
    });
  } else {
    return Promise.resolve(true); // no webhook to add
  }
}
