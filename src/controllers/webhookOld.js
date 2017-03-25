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

// Setup mixpanel
import Mixpanel from 'mixpanel';
let mixpanel;
if (process.env.USE_MIXPANEL) {
  mixpanel = Mixpanel.init(process.env.USE_MIXPANEL);
}


// import the libraries that are required for communication
const ghFactory = require('../github');
let gh = ghFactory.constructor(github);

// ----------------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------------

import webhook from './webhook';

export default function webhookOld(req, res) {
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

  // NOTE: Unfortunately, since there isn't a user attached to a classic webhook, we have to fall
  // back to the backstroke bot user.
  let gh = createGithubInstance({accessToken: process.env.GITHUB_TOKEN});
  return webhook(gh, {
    name: 'Classic Backstroke Webhook',
    enabled: true,
    hookId: null,
    owner: null,
    upstream: {
      type: 'repo',
      name: req.body.repository.full_name,
      fork: req.body.repository.fork,
      html_url: req.body.repository.html_url,
      branches: [req.body.repository.default_branch],
      branch: req.body.repository.default_branch,
    },
    fork: {
      type: 'fork-all',
    },
    allForks: true,
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
}
