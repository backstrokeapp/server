import Promise from 'bluebird';
import GitHubApi from 'github';

import express from 'express';
let app = express();
app.set('view engine', 'ejs');

import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

let github = new GitHubApi({});
github.authenticate({
  type: "oauth",
  token: process.env.GITHUB_TOKEN,
});

let gh = {
  reposGet: Promise.promisify(github.repos.get),
  reposGetBranch: Promise.promisify(github.repos.getBranch),
  reposGetForks: Promise.promisify(github.repos.getForks),
  pullRequestsCreate: Promise.promisify(github.pullRequests.create),
  pullRequestsGetAll: Promise.promisify(github.pullRequests.getAll),

  reposCreateHook: Promise.promisify(github.repos.createHook),
};

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

export function generateUpdateBody(fullRemote) {
  return `Hello!
  The remote \`${fullRemote}\` has some new changes that aren't in this fork.

  So, here they are in an easy pull request to be merged in!
  
  If this pull request can be merged without conflict, you can publish your software with these new changes. If not, this branch is a great place to fix any issues.

  Have fun!
  --------
  Created by River-bot.
  `
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
            head: `${repo.parent.owner.login}:${repo.parent.default_branch}`,
          }).then(existingPulls => {
            // are we trying to reintroduce a pull request that has already been
            // cancelled by the user earlier?
            let duplicateRequests = existingPulls.find(pull => pull.head.sha === upstreamSha);
            if (duplicateRequests === null) {
              // create a pull request to merge in remote changes
              return gh.pullRequestsCreate({
                user: repo.owner.login, repo: repo.name,
                title: `Update from upstream repo ${repo.parent.full_name}`,
                head: `${repo.parent.owner.login}:${repo.parent.default_branch}`,
                base: repo.default_branch,
                body: generateUpdateBody(repo.parent.full_name),
              });
            } else {
              throw new Error(`The PR already has been made. (May have been closed)`);
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

export function addRepository(platform, user, repo) {
  switch (platform) {
    case "github":
      return gh.reposCreateHook({
        user, repo,
        name: "web",
        active: true,
        events: ["push", "release", "pull_request"],
        config: {
          url: process.env.REMOTE_URL + `/ping/github/${user}/${repo}`,
          content_type: "json",
        },
      }).then(hook => {
        console.log(hook);
      });
    default:
      return Promise.reject(`No such platform ${platform}`);
  }
}

app.get("/", (req, res) => res.redirect("https://github.com/1egoman/forkupdater"));

// add a repo to the system
// app.route("/new/:user/:repo")
// .post((req, res) => {
//   addRepository("github", req.params.user, req.params.repo).then(ok => {
//     res.send("Ok, cool, you're all set!");
//   });
// });
app.route("/new")
.get((req, res) => {
  res.render("index");
});

// suggest a merge
app.route("/ping/github/:user/:repo")
.post((req, res) => {
  hasDivergedFromUpstream(
    "github",
    req.body.repository.owner.login,
    req.body.repository.name
  ).then(({repo, diverged, upstreamSha}) => {
    if (diverged) {
      return postUpdate("github", repo, upstreamSha);
    } else {
      res.send("Thanks anyway, but we don't care about that event.");
    }
  }).then(ok => {
    res.send("Cool, thanks github.");
  }).catch(err => {
    res.send(`Uhh, error: ${err}`);
  });
});

app.listen(process.env.PORT || 8000);
