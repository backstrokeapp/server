import express from 'express';
let app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

import morgan from 'morgan';
app.use(morgan('tiny'));

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

// get a repository's data
app.get('/api/v1/repos/:provider/:user/:repo', (req, res) => {
  res.status(200).json({
    _id: `unique-repo-id-${req.params.provider}-${req.params.user}-${req.params.repo}`,
    enabled: true,
    blacklistedForks: [],
    type: 'upstream', // or 'fork'
    provider: 'github',
    repository: {
      name: `${req.params.user}/${req.params.repo}`,
      private: false,
      fork: false,
      html_url: "https://github.com/octocat/Hello-World",
    },
  });
});

// the old webhook route
// app.route("/ping/github/:user/:repo").get((req, res) => {
//   res.redirect(`https://github.com/${req.params.user}/${req.params.repo}`);
// }).post(webhook);

// the webhook route
// app.route("/").get((req, res) => {
//   res.redirect(`https://github.com/1egoman/backstroke`);
// }).post(webhook);

let port = process.env.PORT || 8000;
app.listen(port);
console.log("Listening on port", port, "...");
