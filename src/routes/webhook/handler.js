import {paginateRequest} from '../helpers';
import Debug from 'debug';
const debug = Debug('backstroke:webhook');

import Mixpanel from 'mixpanel';
let mixpanel;
if (process.env.USE_MIXPANEL) {
  mixpanel = Mixpanel.init(process.env.USE_MIXPANEL);
}

function trackWebhook(link) {
  process.env.USE_MIXPANEL && mixpanel.track('Webhook', {
    "Link Id": link._id,
    "From Repo Name": link.upstream ? link.upstream.name : null,
    "From Repo Provider": link.upstream ? link.upstream.provider : null,
    "To Repo Name": link.fork ? (link.fork.name || link.fork.type) : null,
    "To Repo Provider": link.fork ? link.fork.provider : null,
  });
}


function createPullRequest(req, upstream, fork) {
  debug('CREATING PULL REQUEST FROM UPSTREAM %o TO FORK %o', upstream, fork);
  return didRepoOptOut(req, fork).then(didOptOut => {
    // Do we have permission to make a pull request on the child?
    if (didOptOut) {
      debug('REPO OPTED OUT OF PULL REQUESTS %o', fork);
      throw new Error('This repo opted out of backstroke pull requests');
    } else {
      // Create a new pull request from the upstream to the child.
      return req.github.bot.pullRequestsCreate({
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
          throw new Error(`There's already a pull request on ${fork.owner}/${fork.repo}.`);
        } else {
          // Still reject anything else
          return Promise.reject(err);
        }
      });
    }
  });
}

export default function webhook(req, link, pageSize=100) {
  debug('WEBHOOK CAME IN WITH LINK %o', link);
  trackWebhook(link);

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

  return Promise.all([link.upstream(), link.fork()]).then(([upstream, fork]) => {
    // step 1: are we dealing with a repo to merge into or all the forks of a repo?
    if (fork.type === 'repo') {
      debug('WEBHOOK IS ON THE FORK, SO UPSTREAM = %o AND FORK = %o', upstream, fork);
      return createPullRequest(
        req,
        upstream,
        fork
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
      return paginateRequest(req.github.user.reposGetForks, {
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

          return createPullRequest(req, upstream, toRepo);
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
export function didRepoOptOut(req, repoData) {
  return req.github.user.searchIssues({
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
  with these new changes. Otherwise, fix any merge conflicts by clicking the \`Resolve Conflicts\`
  button.

  Have fun!
  --------
  Created by [Backstroke](http://backstroke.us). Oh yea, I'm a bot.
  `.replace('\n', '');
}
