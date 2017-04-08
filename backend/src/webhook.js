import Promise from 'bluebird';
import createGithubInstance from './createGithubInstance';
import {trackWebhook} from './analytics';
import {paginateRequest, internalServerErrorOnError} from './helpers/controllerHelpers';
import Debug from 'debug';
const debug = Debug('backstroke:webhook');

let backstrokeBotInstance = createGithubInstance({accessToken: process.env.GITHUB_TOKEN});

function createPullRequest(
  gh,
  link,
  upstream,
  fork,
  backstrokeBotInstance // Pass in even though it's global so tests can change it.
) {
  debug('CREATING PULL REQUEST FROM UPSTREAM %o TO FORK %o', upstream, fork);
  return didRepoOptOut(gh, fork).then(didOptOut => {
    // Do we have permission to make a pull request on the child?
    if (didOptOut) {
      debug('REPO OPTED OUT OF PULL REQUESTS %o', fork);
      return {msg: "This repo opted out of backstroke pull requests"};
    } else {
      // Create a new pull request from the upstream to the child.
      return backstrokeBotInstance.pullRequestsCreate({
        owner: fork.owner,
        repo: fork.repo,
        title: generatePullRequestTitle(upstream.owner, upstream.repo),
        head: `${upstream.owner}:${upstream.branch}`,
        base: fork.branch,
        body: generatePullRequestBody(upstream.owner, upstream.repo),
        maintainer_can_modify: false,
      }).catch(err => {
        if (err.code === 422) {
          // The pull request already existed
          return {msg: `There's already a pull request on ${fork.owner}/${fork.repo}.`};
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
  debug('WEBHOOK CAME IN WITH LINK %o', link);
  trackWebhook(link);

  // Allow overriding the backstroke bot instance for running tests.
  const backstrokeBotInstance = overrideBackstrokeBotInstance;

  // if disabled, or upstream/fork is null, return so
  if (!link.enabled) {
    return Promise.resolve({error: 'not-enabled', isEnabled: false});
  } else if (!link.upstreamId || !link.forkId) {
    return Promise.resolve({
      error: 'upstream-or-fork-false',
      isEnabled: true,
      msg: 'Please set both a "upstream" and "fork" on this link.',
    });
  }

  return Promise.join(link.upstream(), link.fork(), (upstream, fork) => {
    // step 1: are we dealing with a repo to merge into or all the forks of a repo?
    if (fork.type === 'repo') {
      debug('WEBHOOK IS ON THE FORK, SO UPSTREAM = %o AND FORK = %o', upstream, fork);
      return createPullRequest(
        gh,
        link,
        upstream,
        fork,
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
    } else if (fork.type === 'fork-all') {
      debug('WEBHOOK IS ON THE UPSTREAM, SO UPSTREAM = %o AND MERGING INTO ALL FORKS', upstream);
      // Get all forks.
      return paginateRequest(gh.reposGetForks, {
        owner: upstream.owner,
        repo: upstream.repo,
      }).then(forks => {
        debug('FOUND %d FORKS.', forks.length);
        let all = forks.map(fork => {
          // Assemble a repo to sync changes to.
          // This has to be assembled because the `to` repo is generated when iterating through
          // forks.
          let toRepo = {
            type: 'repo',
            owner: fork.owner.login,
            repo: fork.name,
            fork: true,
            branch: upstream.branch, // same branch as the upstream. TODO: make this configurable.
            branches: [],
          };

          return createPullRequest(gh, link, upstream, toRepo, backstrokeBotInstance);
        });

        return Promise.all(all);
      }).then(data => {
        return {
          status: 'ok',
          many: true,
          forkCount: data.length, // total amount of forks handled
          isEnabled: true,
        };
      });
    } else {
      throw new Error(`No such 'fork' type: ${link.fork.type}`);
    }
  });
}

// Given a repository `user/repo` and a provider that the repo is located on (ex: `github`),
// determine if the repo opted out.
export function didRepoOptOut(inst, repoData) {
  return inst.searchIssues({
    q: `repo:${repoData.owner}/${repoData.repo} is:pr label:optout`,
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
