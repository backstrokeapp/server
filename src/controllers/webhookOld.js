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
  }


  webhook(gh, {
    name: 'Classic Backstroke Webhook',
    enabled: true,
    hookId: null,
    owner: null,
    upstream: {
      type: 'repo',
      name: 'foo/bar',
      fork: false,
      html_url: 'https://github.com/foo/bar',
      branches: ['master'],
      branch: 'master',
    },
    fork: {},
    allForks: true,
  })
}
