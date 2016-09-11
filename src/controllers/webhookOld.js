const Promise = require('bluebird');
const GitHubApi = require('github');

// configure github api client
let github = new GitHubApi({});
if (process.env.GITHUB_TOKEN) {
  github.authenticate({
    type: "oauth",
    token: process.env.GITHUB_TOKEN,
  });
} else {
  console.warn("Warning: No github token specified.");
}

// import the libraries that are required for communication
const ghFactory = require('../github');
let gh = ghFactory.constructor(github);

// has the given fork diverged from its parent?
export function hasDivergedFromUpstream(platform, user, repo) {
  switch (platform) {
    case "github":
      let repoContents;
      return gh.reposGet({user, repo}).then(repoData => {
        repoContents = repoData;
        if (repoData.parent) {
          return Promise.all([
            // base branch
            gh.reposGetBranch({
              user,
              repo,
              branch: repoData.default_branch,
            }),
            // upstream branch
            gh.reposGetBranch({
              user: repoData.parent.owner.login,
              repo: repoData.parent.name,
              branch: repoData.parent.default_branch,
            }),
          ]);
        } else {
          throw new Error(`The repository ${user}/${repo} isn't a fork.`);
        }
      }).then(([base, upstream]) => {
        return {
          repo: repoContents,
          diverged: base.commit.sha !== upstream.commit.sha,
          baseSha: base.commit.sha,
          upstreamSha: upstream.commit.sha,
        };
      });
    default:
      return Promise.reject(`No such platform ${platform}`);
  }
}

export function generateUpdateBody(fullRemote, tempRepoName) {
  return `Hello!
  The remote \`${fullRemote}\` has some new changes that aren't in this fork.

  So, here they are, ready to be merged! :tada:

  If this pull request can be merged without conflict, you can publish your software
  with these new changes.  Otherwise, if you have merge conflicts, this
  is the place to fix them.

  Have fun!
  --------
  Created by [Backstroke](http://backstroke.us). Oh yea, I'm a bot.
  PS. **Hey, there's a new version of Backstroke available. If you'd like to configure repo-to-repo syncing or sync to all forks, [check it out here](http://backstroke.us).**
  `
}

// does a user want to opt out of receiving backstroke PRs?
export function didUserOptOut(platform, user, repo) {
  switch (platform) {
    case "github":
      return gh.searchIssues({
        q: `repo:${user}/${repo} is:pr label:optout`,
      }).then(issues => {
        return issues.total_count > 0;
      });
    default:
      return Promise.reject(`No such platform ${platform}`);
  }
}

// given a platform and a repository, open the pr to update it to its upstream.
export function postUpdate(platform, repo, upstreamSha) {
  switch (platform) {
    case "github":
      if (repo) {
        if (repo.parent) {
          return gh.pullRequestsGetAll({
            user: repo.owner.login || repo.owner.name,
            repo: repo.name,
            state: "open",
            head: `${repo.parent.owner.login}:${repo.parent.default_branch}`,
          }).then(existingPulls => {
            // are we trying to reintroduce a pull request that has already been
            // made previously?
            let duplicateRequests = existingPulls.find(pull => pull.head.sha === upstreamSha);
            if (!duplicateRequests) {
              console.info("Making pull to", repo.owner.login, repo.name);
              // create a pull request to merge in remote changes
              return gh.pullRequestsCreate({
                user: repo.owner.login, repo: repo.name,
                title: `Update from upstream repo ${repo.parent.full_name}`,
                head: `${repo.parent.owner.login}:${repo.parent.default_branch}`,
                base: repo.default_branch,
                body: generateUpdateBody(repo.parent.full_name),
              });
            } else {
              throw new Error(`The PR already has been made.`);
            }
          });
        } else {
          return Promise.reject(new Error(`The repository ${repo.full_name} isn't a fork.`));
        }
      } else {
        return Promise.reject(new Error(`No repository found`));
      }
    default:
      return Promise.reject(`No such platform ${platform}`);
  }
}

// get the upstream user and repo name to check changes relative from
export function getUpstream(repository, opts={}) {
  let upstream = opts.upstream && opts.upstream.split("/");
  if (upstream && upstream.length === 2) {
    // a custom upstream
    return {user: upstream[0], repo: upstream[1]};
  } else if (repository && repository.fork && repository.parent) {
    // this is a fork, so the upstream is the parent repo
    return {
      user: repository.parent.owner.name || repository.parent.owner.login,
      repo: repository.parent.name,
    }
  } else {
    // this is the upstream, so just grab the current repo infirmation
    return {
      user: repository.owner.name || repository.owner.login,
      repo: repository.name,
    }
  }
}

// ----------------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------------

export default function webhook(req, res) {
  // the repo is a fork, or the user has manually specified an upstream to merge into
  if (
    (req.body && req.body.repository && req.body.repository.fork) ||
    req.query.upstream
  ) {
    // Try to merge upstream changes into the passed repo
    console.info("Merging upstream", req.body.repository.full_name);
    return isForkMergeUpstream(req.body.repository, req.query).then(msg => {
      if (typeof msg === "string") {
        res.send(msg);
      } else {
        res.send("Success!");
      }
    }).catch(err => {
      res.send(`Uhh, error: ${err}`);
    });
  } else {
    // Find all forks of the current repo and merge the passed repo's changes
    // into each
    console.info("Finding forks", req.body.repository.full_name);
    return isParentFindForks(req.body.repository, req.query).then(msg => {
      if (typeof msg === "string") {
        res.send(msg);
      } else {
        res.send("Success!");
      }
    }).catch(err => {
      res.send(`Uhh, error: ${err}`);
    });
  }
}

// given a fork, create a pull request to merge in upstream changes
export function isForkMergeUpstream(repository, opts={}) {
  // get the upstream to merge into
  let {user: upstreamName, repo: upstreamRepo} = getUpstream(repository, opts);
  let repoName = repository.name, repoUser = repository.owner.name || repository.owner.login;

  // don't bug opted out users (opt out happens on the fork)
  return didUserOptOut("github", repoUser, repoName).then(didOptOut => {
    if (didOptOut) {
      console.info(`Repo ${repoUser}/${repoName} opted out D:`);
      return {repo: null, diverged: false};
    } else {
      // otherwise, keep going...
      return hasDivergedFromUpstream("github", repoUser, repoName);
    }
  }).then(({repo, diverged, upstreamSha}) => {
    if (diverged) {
      // make a pull request
      return postUpdate("github", repo, upstreamSha).then(ok => {
        return true; // success
      });
    } else {
      return "Thanks anyway, but the user either opted out or this isn't an imporant event.";
    }
  });
}

export function isParentFindForks(repository, opts={}) {
  return gh.reposGetForks({
    user: repository.owner.name || repository.owner.login,
    repo: repository.name,
  }).then(forks => {
    let pullreqs = forks.map(fork => {
      return isForkMergeUpstream(fork, opts);
    });

    return Promise.all(pullreqs).then(reqs => {
      let madePRs = reqs.filter(i => i); // all truthy pull requests
      return `Opened ${madePRs.length} pull requests on forks of this repository.`;
    });
  });
}
