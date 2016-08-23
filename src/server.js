import express from 'express';
let app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

import morgan from 'morgan';
app.use(morgan('tiny'));

// Disable cors (for now, while in development)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// identify the currently logged in user
app.get('/api/v1/whoami', (req, res) => {
  res.status(200).json({
    _id: 'unique-user-id',
    provider: 'github',
    user: '1egoman',
    picture: 'https://avatars.githubusercontent.com/u/1704236?v=3',
    email: 'rsg1egoman@gmail.com',
  });
});

app.get('/api/v1/links', (req, res) => {
  res.status(200).json({
    data: [
      {
        _id: 'link-one',
        name: 'Link Name',
        paid: true,
        enabled: true,
        from: {
          private: false,
          name: 'octocat/Hello-World',
          provider: 'github',
          fork: false,
          html_url: "https://github.com/octocat/Hello-World",
          branches: ['master', 'dev', 'feature/someting-else'],
          branch: 'master',
        },
        to: {
          private: true,
          name: '1egoman/some-mirror',
          provider: 'github',
          fork: true,
          html_url: "https://github.com/octocat/Hello-World",
          branches: ['master', 'dev', 'feature/someting-else'],
          branch: 'master',
        },
      },
    ],
    lastId: `link-one`,
  });
});

app.get('/api/v1/links/:id', (req, res) => {
  res.status(200).json({
    _id: 'link-one',
    name: 'Link Name',
    paid: true,
    enabled: true,
    from: {
      private: false,
      name: 'octocat/Hello-World',
      provider: 'github',
      fork: false,
      html_url: "https://github.com/octocat/Hello-World",
      branches: ['master', 'dev', 'feature/someting-else'],
    },
    to: {
      private: true,
      name: '1egoman/some-mirror',
      provider: 'github',
      fork: true,
      html_url: "https://github.com/octocat/Hello-World",
      branches: ['master', 'dev', 'feature/someting-else'],
    },
  });
});


app.get('/api/v1/repos', (req, res) => {
  res.status(200).json({
    data: [
      {_id: 'one', name: 'octocat/Hello-World', provider: 'github', enabled: true},
      {_id: 'two', name: '1egoman/backstroke', provider: 'github', enabled: true},
      {_id: 'three', name: 'some-other/repo-here', provider: 'github', enabled: true},
    ],
    lastId: `unique-repo-id-github-some-other-repo-here`,
  });
});

// get a repository's data
app.get('/api/v1/repos/:provider/:user/:repo', (req, res) => {
  res.status(200).json({
    _id: `unique-repo-id-${req.params.provider}-${req.params.user}-${req.params.repo}`,
    enabled: true,
    blacklistedForks: [],
    type: 'upstream', // or 'fork'
    repository: {
      name: `${req.params.user}/${req.params.repo}`,
      private: false,
      fork: false,
      html_url: "https://github.com/octocat/Hello-World",
      provider: 'github',
      branches: ['master', 'dev', 'feature/someting-else'],
    },
    changes: [
      {
        fromBranch: "master",
        items: [
          {
            type: "pull_request",
            repository: {
              name: `propose-to/this-repo`,
              private: false,
              fork: false,
              html_url: "https://github.com/propose-to/this-repo",
              provider: 'github',
              branches: ['master', 'dev', 'feature/someting-else'],
            },
            branch: 'master',
          },
          {
            type: "pull_request",
            repository: {
              name: `propose-to/this-other-repo`,
              private: false,
              fork: false,
              html_url: "https://github.com/propose-to/this-other-repo",
              provider: 'github',
              branches: ['master', 'dev', 'feature/someting-else'],
            },
            branch: 'another-branch',
          },
        ],
      },
    ],
  });
});

// enable or disable a repository
app.post('/api/v1/link/:id/enable', (req, res) => {
  res.status(200).json({success: true});
});

// the old webhook route
// app.route("/ping/github/:user/:repo").get((req, res) => {
//   res.redirect(`https://github.com/${req.params.user}/${req.params.repo}`);
// }).post(webhook);

// the webhook route
// app.route("/").get((req, res) => {
//   res.redirect(`https://github.com/1egoman/backstroke`);
// }).post(webhook);

let port = process.env.PORT || 8001;
app.listen(port);
console.log("Listening on port", port, "...");
