import Promise from 'bluebird';
import GitHubApi from 'github';
import createGithubInstance from '../createGithubInstance';

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

// Setup mixpanel
import Mixpanel from 'mixpanel';
let mixpanel;
if (process.env.USE_MIXPANEL) {
  mixpanel = Mixpanel.init(process.env.USE_MIXPANEL);
}


// NOTE: Unfortunately, since there isn't a user attached to a classic webhook, we have to fall
// back to the backstroke bot user.
const gh = createGithubInstance({accessToken: process.env.GITHUB_TOKEN});

// ----------------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------------

export default function webhookOld(webhook, backstrokeBotInstance, req, res) {
  // Analytics
  if (
    (req.body && req.body.repository && req.body.repository.fork) ||
    req.query.upstream
  ) {
    process.env.USE_MIXPANEL && mixpanel.track('Webhook Old', {
      "Location": "fork",
      "Fork": req.body.repository.full_name,
      "Upstream": req.body.repository.parent && req.body.repository.parent.name,
    });
  } else if (req.body && req.body.repository) {
    process.env.USE_MIXPANEL && mixpanel.track('Webhook Old', {
      "Location": "upstream",
      "Upstream": req.body.repository.full_name,
      "Fork": "all forks",
    });
  }

  backstrokeBotInstance = backstrokeBotInstance || gh;

  if (req.body && 
      req.body.repository && req.body.repository.name &&
      req.body.repository.owner && req.body.repository.owner.login) {

    // Fetch the repository that we're querying.
    backstrokeBotInstance.reposGet({
      owner: req.body.repository.owner.login,
      repo: req.body.repository.name,
    }).then(repository => {
      // Assemble a repository from the request body.
      let upstream, fork;

      function assembleRepo(repo) {
        return {
          type: 'repo',
          owner: repo.owner.login,
          repo: repo.name,
          fork: repo.fork,
          html_url: repo.html_url,
          branches: [repo.default_branch],
          branch: repo.default_branch,
        };
      }

      if (repository.fork) {
        // Webhook is on a fork, so upstream == `repository.parent` and fork == `repository`
        upstream = assembleRepo(repository.parent);
        fork = assembleRepo(repository);
      } else {
        // Webhook is on upstream, so upstream == `repository` and update all forks
        upstream = assembleRepo(repository);
        fork = {type: 'fork-all'};
      }

      return webhook(backstrokeBotInstance, {
        name: 'Classic Backstroke Webhook',
        enabled: true,
        hookId: null,
        owner: null,
        upstreamId: "DUMMY",
        forkId: "DUMMY",
        upstream: () => upstream,
        fork: () => fork,
      }).then(output => {
        if (output.isEnabled === false) {
          res.status(200).send({
            enabled: false,
            status: 'not-enabled',
            msg: `The webhook isn't enabled.`,
          });
        } else {
          res.status(201).send({status: 'ok', output});
        }
      });
    }).catch(err => {
      res.status(err.code || 500).send(err);
    });
  } else {
    res.status(400).send({error: 'Please send a github webhook response!'});
  }
}
