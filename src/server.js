import express from 'express';
let app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

// ----------------------------------------------------------------------------
// Mongo stuff
// ----------------------------------------------------------------------------
import mongoose from 'mongoose';
mongoose.connect(process.env.MONGO_URI);
import User from 'models/User';

// ----------------------------------------------------------------------------
// Passport stuff
// ----------------------------------------------------------------------------
import passport from 'passport';
import session from 'express-session';
import strategy from 'auth/strategy';
import serialize from 'auth/serialize';
app.use(session({secret: process.env.SESSION_SECRET}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(strategy(User));
serialize(User, passport);

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

// Authenticate a user
app.get('/setup/login', passport.authenticate('github', {
  successRedirect: '/',
  failureRedirect: '/setup/login',
  scope: ["repo", "write:repo_hook"],
}));

app.get("/auth/github/callback", passport.authenticate("github", {
  failureRedirect: '/login',
  failureFlash: true,
}), (req, res) => {
  res.redirect('/'); // on success
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

// get all links
app.get('/api/v1/links', (req, res) => {
  res.status(200).json({
    data: [
      {
        _id: 'link-one',
        name: 'Link Name',
        paid: true,
        enabled: true,
        from: {
          type: 'repo',
          private: false,
          name: 'octocat/Hello-World',
          provider: 'github',
          fork: false,
          html_url: "https://github.com/octocat/Hello-World",
          branches: ['master', 'dev', 'feature/someting-else'],
          branch: 'master',
        },
        to: {
          type: 'repo',
          private: true,
          name: '1egoman/some-mirror',
          provider: 'github',
          fork: true,
          html_url: "https://github.com/octocat/Hello-World",
          branches: ['master', 'dev', 'feature/someting-else'],
          branch: 'master',
        },
      },
      {
        _id: 'link-two',
        name: 'Link Name (maps to all forks)',
        paid: true,
        enabled: true,
        from: {
          type: 'repo',
          private: false,
          name: 'octocat/Hello-World',
          provider: 'github',
          fork: false,
          html_url: "https://github.com/octocat/Hello-World",
          branches: ['master', 'dev', 'feature/someting-else'],
          branch: 'master',
        },
        to: {
          provider: 'github',
          type: 'fork-all',
        },
      },
    ],
    lastId: `link-one`,
  });
});

// return the branches for a given repo
app.get('/api/v1/repos/:provider/:user/:repo', (req, res) => {
  return res.status(200).json({
    branches: ["master", "branch-1", "branch-2"],
    private: true,
    fork: true,
  });
});

// create a new repo
app.post('/api/v1/repos', (req, res) => {
  res.status(200).send({
    _id: 'brand-spaking-new-repo',
    enabled: false,
    to: null,
    from: null,
  });
});

// GET a given link
app.get('/api/v1/links/:id', (req, res) => {
  res.status(200).json({
    _id: 'link-one',
    name: 'Link Name',
    paid: true,
    enabled: true,
    from: {
      type: 'repo',
      private: false,
      name: 'octocat/Hello-World',
      provider: 'github',
      fork: false,
      html_url: "https://github.com/octocat/Hello-World",
      branches: ['master', 'dev', 'feature/someting-else'],
      branch: 'master',
    },
    to: null,
    // to: {
      // type: 'fork-all',
      // provider: 'github',

      // type: 'repo',
      // private: true,
      // name: '1egoman/some-mirror',
      // provider: 'github',
      // fork: true,
      // html_url: "https://github.com/octocat/Hello-World",
      // branches: ['master', 'dev', 'feature/someting-else'],
      // branch: 'master',
    // },
  });
});

// POST link updates
app.post('/api/v1/links/:linkId', (req, res) => {
  res.status(200).send({status: 'ok'});
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
