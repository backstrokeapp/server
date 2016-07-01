import Promise from 'bluebird';
import GitHubApi from 'github';

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
import * as ghFactory from './github';
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

  If this pull request can be merged without conflict, you can publish your software with these new changes.

  If not, we've taken the liberty of creating a new repository that mirrors
  upstream, located at backstroke-bot/${tempRepoName}, and given all contributors
  to this repository permisson to push to it. If you have merge conflicts, this
  is the place to fix them.

  Have fun!
  --------
  Created by [Backstroke](http://backstroke.us). Oh yea, I'm a bot.
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
            user: repo.owner.login,
            repo: repo.name,
            state: "open",
            head: `${repo.parent.owner.login}:${repo.parent.default_branch}`,
          }).then(existingPulls => {
            // are we trying to reintroduce a pull request that has already been
            // made previously?
            let duplicateRequests = existingPulls.find(pull => pull.head.sha === upstreamSha);
            if (!duplicateRequests) {
              console.log("Making pull to", repo.owner.login, repo.name);
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
          throw new Error(`The repository ${repo.full_name} isn't a fork.`);
        }
      } else {
        throw new Error(`No repository found for ${repo.full_name}`);
      }
    default:
      return Promise.reject(`No such platform ${platform}`);
  }
}

// ----------------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------------

export function webhook(req, res) {
  if (req.body && req.body.repository && req.body.repository.fork) {
    // Try to merge upstream changes into the passed repo
    console.log("Merging upstream", req.body.repository.full_name);
    return isForkMergeUpstream(req, res);
  } else {
    // Find all forks of the current repo and merge the passed repo's changes
    // into each
    console.log("Finding forks", req.body.repository.full_name);
    return isParentFindForks(req, res);
  }
}

export function isForkMergeUpstream(req, res) {
  let userName = req.body.repository.owner.name || req.body.repository.owner.login,
      repoName = req.body.repository.name;
  didUserOptOut("github", userName, repoName).then(didOptOut => {
    // don't bug opted out users
    if (didOptOut) {
      console.log(`Repo ${userName}/${repoName} opted out D:`);
      return {repo: null, diverged: false};
    } else {
      // otherwise, keep going...
      return hasDivergedFromUpstream("github", userName, repoName);
    }
  }).then(({repo, diverged, upstreamSha}) => {
    if (diverged) {
      // make a pull request
      return postUpdate("github", repo, upstreamSha).then(ok => {
        res.send("Cool, thanks github.");
      });
    } else {
      res.send("Thanks anyway, but the user either opted out or this isn't an imporant event.");
    }
  }).catch(err => {
    res.send(`Uhh, error: ${err}`);
  });
}

export function isParentFindForks(req, res) {
  let userName = req.body.repository.owner.name || req.body.repository.owner.login,
      repoName = req.body.repository.name;
  gh.reposGetForks({
    user: userName,
    repo: repoName,
  }).then(forks => {
    let pullreqs = forks.map(fork => {
      return didUserOptOut("github", fork.owner.login, fork.name).then(didOptOut => {
        // don't bug opted out users
        if (didOptOut) {
          console.log(`Repo ${fork.owner.login}/${fork.name} opted out D:`);
          return {repo: null, diverged: false};
        } else {
          // otherwise, keep going...
          return hasDivergedFromUpstream(
            "github",
            fork.owner.login, // user
            fork.name         // repo
          );
        }
      }).then(({repo, diverged, upstreamSha}) => {
        if (diverged) {
          // make a pull request
          return postUpdate("github", repo, upstreamSha);
        } else {
          res.send("User opted out or upstream doesn't diverge.");
        }
      });
    });

    return Promise.all(pullreqs).then(reqs => {
      let madePRs = reqs.filter(i => i); // all truthy pull requests
      res.send(`Opened ${madePRs.length} pull requests on forks of this repository.`);
    });
  }).catch(err => {
    res.send(`Uhh, error: ${err}`);
  });
}
