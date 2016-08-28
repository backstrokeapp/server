import Promise from 'bluebird';
import getRepoName from 'helpers/getRepoName';
import createGithubInstance from '../createGithubInstance';

export default function webhook(gh, link) {
  let backstrokeBotInstance = createGithubInstance({accessToken: process.env.GITHUB_TOKEN});

  function actOnRepo(from, to) {
    return alreadyHasPullRequest(gh, to.provider, from, to).then(hasPull => {
      // Does the PR already exist?
      if (hasPull) {
        return false;
      } else {
        // Do we have permission to make a pull request on the child?
        return didRepoOptOut(gh, to.provider, to).then(didOptOut => {
          if (didOptOut) {
            return false;
          } else {
            // Then, make the pull request
            return createPullRequest(backstrokeBotInstance, to.provider, from, to);
          }
        });
      }
    });
  }

  // step 1: are we dealing with a repo to merge into or all the forks of a repo?
  if (link.to.type === 'repo') {
    return actOnRepo(link.from, link.to);

  } else if (link.to.type === 'fork-all') {
    let pageSize = 100; // (100 = max page size)
    let [user, repo] = getRepoName(link.from);

    // Fetch each fork, then try to make a pull request.
    function getForks(page) {
      return gh.reposGetForks({
        user, repo, page,
        per_page: pageSize,
      }).then(forks => {
        // Act on each fork
        forks.forEach(fork => {
          actOnRepo(link.from, { // to
            type: 'repo',
            provider: link.to.provider,
            name: fork.full_name,
            private: fork.private,
            fork: true,
            branch: link.from.branch, // same branch as the upstream. TODO: make this configurable.
            branches: [],
          });
        });

        // if required, go to the next page of forks
        if (forks.length === pageSize) {
          return getForks(++page);
        }
      });
    }

    return getForks(0);
  } else {
    throw new Error(`No such 'to' type: ${link.to.type}`);
  }
}

// Given a repository `user/repo` and a provider that the repo is located on (ex: `github`),
// determine if the repo opted out.
export function didRepoOptOut(inst, provider, repoData) {
  let [user, repo] = getRepoName(repoData);
  switch (provider) {
    case 'github':
      return inst.searchIssues({
        q: `repo:${user}/${repo} is:pr label:optout`,
      }).then(issues => {
        return issues.total_count > 0;
      });

    default:
      throw new Error(`No such provider ${provider}`);
  }
}

// Does the specified relationship from the upstream to the child exist?
export function alreadyHasPullRequest(inst, provider, upstreamRepoModel, childRepoModel) {
  let [upstreamUser, upstreamRepo] = getRepoName(upstreamRepoModel);
  let [childUser, childRepo] = getRepoName(childRepoModel);

  switch (provider) {
    case "github":
      // Get all pull requests
      return inst.pullRequestsGetAll({
        user: childUser,
        repo: childRepo,
        state: "open",

        // A PR on the child from the upstream
        head: `${upstreamUser}:${upstreamRepoModel.branch}`,
        base: childRepoModel.branch,
      }).then(existingPulls => {
        return existingPulls.length > 0;
      });

    default:
      throw new Error(`No such provider ${provider}`);
  }
}

// Get the head commit of a branch.
export function getBranchHEAD(inst, provider, upstreamRepoModel) {
  let [user, repo] = getRepoName(upstreamRepoModel);
  switch (provider) {
    case 'github':
      return inst.reposGetBranch({
        user, repo,
        branch: upstreamRepoModel.branch,
      }).then(branch => {
        return branch.commit.sha;
      });
    default:
      throw new Error(`No such provider ${provider}`);
  }
}

// Create a new pull request from the upstream to the child.
export function createPullRequest(inst, provider, upstreamRepoModel, childRepoModel) {
  let [upstreamUser, upstreamRepo] = getRepoName(upstreamRepoModel);
  let [childUser, childRepo] = getRepoName(childRepoModel);

  switch (provider) {
    case 'github':
      return inst.pullRequestsCreate({
        user: childUser, repo: childRepo,
        title: `Update from upstream repo ${upstreamUser}/${upstreamRepo}`,
        head: `${upstreamUser}:${upstreamRepoModel.branch}`,
        base: childRepoModel.branch,
        body: "backstroke update",
      });
    default:
      throw new Error(`No such provider ${provider}`);
  }
}
