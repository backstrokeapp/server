import express from 'express';
let app = express();
app.set('view engine', 'ejs');
app.use(express.static('build'));
import Promise from 'bluebird';

import whoami from 'controllers/whoami';
import * as links from 'controllers/links';
import {checkRepo} from 'controllers/checkRepo';
import webhook from 'controllers/webhook';
import webhookOld from 'controllers/webhookOld';

import isLinkPaid from 'helpers/isLinkPaid';
import addWebhooksForLink from 'helpers/addWebhooksForLink';

// ----------------------------------------------------------------------------
// Mongo stuff
// ----------------------------------------------------------------------------
import mongoose from 'mongoose';
mongoose.connect(process.env.MONGO_URI);
mongoose.Promise = Promise;
import User from 'models/User';
import Link from 'models/Link';

// ----------------------------------------------------------------------------
// Set up session store
// ----------------------------------------------------------------------------
const MongoStore = require('connect-mongo')(session),
mongoStore = new MongoStore({mongooseConnection: mongoose.connection});

// ----------------------------------------------------------------------------
// Passport stuff
// ----------------------------------------------------------------------------
import passport from 'passport';
import session from 'express-session';
import strategy from 'auth/strategy';
import serialize from 'auth/serialize';
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: mongoStore,
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(strategy(User));
serialize(User, passport);

import bodyParser from 'body-parser';
import morgan from 'morgan';
app.use(morgan('tiny'));

// Authenticate a user
app.get('/setup/login', passport.authenticate('github', {
  successRedirect: '/',
  failureRedirect: '/setup/login',
  scope: ["public_repo", "write:repo_hook", "user:email"],
}));
app.get('/setup/login/private', passport.authenticate('github', {
  successRedirect: '/setup/login',
  failureRedirect: '/setup/login',
  scope: ["repo", "write:repo_hook", "user:email"],
}));

// Second leg of the auth
app.get("/auth/github/callback", passport.authenticate("github", {
  failureRedirect: '/setup/login',
}), (req, res) => {
  res.redirect('/'); // on success
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// identify the currently logged in user
app.get('/api/v1/whoami', whoami);

// get all links
app.get('/api/v1/links', bodyParser.json(), links.index.bind(null, Link));

// GET a given link
app.get('/api/v1/links/:id', bodyParser.json(), links.get.bind(null, Link));

// delete a link
app.del('/api/v1/links/:id', links.del.bind(null, Link));

// return the branches for a given repo
app.get('/api/v1/repos/:provider/:user/:repo', bodyParser.json(), checkRepo);

// create a new link
app.post('/api/v1/links', bodyParser.json(), links.create.bind(null, Link));

// POST link updates
app.post('/api/v1/links/:linkId', bodyParser.json(),
  links.update.bind(null, Link, isLinkPaid, addWebhooksForLink));

// enable or disable a repository
app.post('/api/v1/link/:linkId/enable', bodyParser.json(), links.enable.bind(null, Link));

// the old webhook route
// app.route("/ping/github/:user/:repo").get((req, res) => {
//   res.redirect(`https://github.com/${req.params.user}/${req.params.repo}`);
// }).post(webhook);

// the old webhook route
app.post("/", bodyParser.json(), webhookOld);

// the new webhook route
app.all('/_:linkId', webhook.bind(null, Link));

let port = process.env.PORT || 8001;
app.listen(port);
console.log("Listening on port", port, "...");
