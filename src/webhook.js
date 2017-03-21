import Promise from 'bluebird';
import getRepoName from './helpers/getRepoName';
import createGithubInstance from './createGithubInstance';
import {trackWebhook} from './analytics';
import {paginateRequest} from './helpers/controllerHelpers';

let backstrokeBotInstance = createGithubInstance({accessToken: process.env.GITHUB_TOKEN});

function createPullRequest(
  gh,
  link,
  from,
  to,
  backstrokeBotInstance // Pass in even though it's global so tests can change it.
) {
  return didRepoOptOut(gh, to).then(didOptOut => {
    // Do we have permission to make a pull request on the child?
    if (didOptOut) {
      return {msg: "This repo opted out of backstroke pull requests"};
    } else {
      // Create a new pull request from the upstream to the child.
      let [upstreamUser, upstreamRepo] = getRepoName(from);
      let [childUser, childRepo] = getRepoName(to);

      return backstrokeBotInstance.pullRequestsCreate({
        owner: childUser,
        repo: childRepo,
        title: generatePullRequestTitle(upstreamUser, upstreamRepo),
        head: `${upstreamUser}:${from.branch}`,
        base: to.branch,
        body: generatePullRequestBody(upstreamUser, upstreamRepo),
        maintainer_can_modify: false,
      }).catch(err => {
        if (err.code === 422) {
          // The pull request already existed
          return {msg: `There's already a pull request on ${childUser}/${childRepo}.`};
        } else {
          // Still reject anything else
          return Promise.reject(err);
        }
      });
    }
  });
}

export default function webhook(
  gh,
  link,
  pageSize=100,
  // The below param is only used for tests to override the global `backstrokeBotInstance`
  overrideBackstrokeBotInstance=backstrokeBotInstance
) {
  trackWebhook(link);

  // Allow overriding the backstroke bot instance for running tests.
  const backstrokeBotInstance = overrideBackstrokeBotInstance;

  // if disabled, or to/from is null, return so
  if (!link.enabled) {
    return Promise.resolve({error: 'not-enabled', isEnabled: false});
  } else if (!link.to || !link.from) {
    return Promise.resolve({
      error: 'to-or-from-false',
      isEnabled: true,
      msg: 'Please set both a "to" and "from" on this link.',
    });
  }

  // step 1: are we dealing with a repo to merge into or all the forks of a repo?
  if (link.to.type === 'repo') {
    return createPullRequest(
      gh,
      link,
      link.from,
      link.to,
      backstrokeBotInstance
    ).then(response => {
      return {
        status: 'ok',
        pullRequest: response,
        isEnabled: true,
        many: false,
        forkCount: 1, // just one repo
      };
    });
  } else if (link.to.type === 'fork-all') {
    let [user, repo] = getRepoName(link.from);

    // Fetch each fork, then try to make a pull request.
    function getForks(page) {
      let allForks = [];
      return gh.reposGetForks({
        owner: user,
        repo, page,
        per_page: pageSize,
      }).then(forks => {

        // add a conglomeration of the previous promises to the group of all forks
        allForks.push(Promise.all(forkGroup));

        // if required, go to the next page of forks
        if (forks.length === pageSize) {
          return getForks(++page);
        } else {
          return Promise.all(allForks).then(success => {
            return {
              status: 'ok',
              many: true,
              forkCount: (page * pageSize) + forks.length, // total amount of forks handled
              isEnabled: true,
            };
          });
        }
      });
    }

    // Get all forks.
    return paginateRequest(gh.reposGetForks, {owner: user, repo}).then(forks => {
      let all = forks.map(fork => {
        // Assemble a repo to sync changes to.
        // This has to be assembled because the `to` repo is generated when iterating through
        // forks.
        let toRepo = {
          type: 'repo',
          provider: link.to.provider,
          name: fork.full_name,
          private: fork.private,
          fork: true,
          branch: link.from.branch, // same branch as the upstream. TODO: make this configurable.
          branches: [],
        };

        return createPullRequest(gh, link, link.from, toRepo, backstrokeBotInstance);
      });

      return Promise.all(all);
    }).then(data => {
      return {
        status: 'ok',
        many: true,
        forkCount: forks.length, // total amount of forks handled
        isEnabled: true,
      };
    });
  } else {
    throw new Error(`No such 'to' type: ${link.to.type}`);
  }
}

// Given a repository `user/repo` and a provider that the repo is located on (ex: `github`),
// determine if the repo opted out.
export function didRepoOptOut(inst, repoData) {
  let [user, repo] = getRepoName(repoData);
  return inst.searchIssues({
    q: `repo:${user}/${repo} is:pr label:optout`,
  }).then(issues => {
    return issues.total_count > 0;
  });
}

export function generatePullRequestTitle(user, repo) {
  return `Update from upstream repo ${user}/${repo}`;
}

export function generatePullRequestBody(user, repo) {
  return `Hello!
  The remote \`${user}/${repo}\` has some new changes that aren't in this fork.
  So, here they are, ready to be merged! :tada:

  If this pull request can be merged without conflict, you can publish your software
  with these new changes.

  If you have merge conflicts, this is a great place to fix them.

  Have fun!
  --------
  Created by [Backstroke](http://backstroke.us). Oh yea, I'm a bot.
  `.replace('\n', '');
}
