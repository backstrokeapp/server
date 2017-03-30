import express from 'express';
let app = express();
export default app;

app.set('view engine', 'ejs');
app.use(express.static('build'));

import whoami from 'controllers/whoami';
import * as links from 'controllers/links';
import checkRepo from 'controllers/checkRepo';

import webhook from './webhook';
import webhookRoute from 'controllers/webhook';
import webhookOld from 'controllers/webhookOld';

import {addWebhooksForLink, removeOldWebhooksForLink} from 'helpers/addWebhooksForLink';

// ----------------------------------------------------------------------------
// Database stuff
// ----------------------------------------------------------------------------
import {Schema} from 'jugglingdb';
import userBuilder from 'models/User';
import linkBuilder from 'models/Link';
import repositoryBuilder from 'models/Repository';
// const schema = new Schema('sqlite3', {database: 'db.sqlite3'});
const schema = new Schema('mongodb', {
  url: 'mongodb://backstroke:backstroke@ds017256.mlab.com:17256/backstroke-dev',
});
const User = userBuilder(schema);
const Repository = repositoryBuilder(schema);
const Link = linkBuilder(schema);

if (process.env.MIGRATE) {
  console.log('Migrating schema...');
  schema.automigrate();
  console.log('Done.');
}

// ----------------------------------------------------------------------------
// Passport stuff
// ----------------------------------------------------------------------------
import passport from 'passport';
import session from 'express-session';
import strategy from 'auth/strategy';
import serialize from 'auth/serialize';
app.use(session({
  secret: process.env.SESSION_SECRET,
  // store: mongoStore,
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
  failureRedirect: '/setup/failed',
  scope: ["repo", "write:repo_hook", "user:email"],
}));
app.get('/setup/login/public', passport.authenticate('github', {
  successRedirect: '/',
  failureRedirect: '/setup/failed',
  scope: ["public_repo", "write:repo_hook", "user:email"],
}));

// Second leg of the auth
app.get("/auth/github/callback", passport.authenticate("github", {
  failureRedirect: '/setup/failed',
}), (req, res) => {
  res.redirect('/#/links'); // on success
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// A utility function to check if a user is authenticated, and if so, return
// the authenticated user. Otherwise, this function will throw an error
function assertLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).send({error: 'Not authenticated.'});
  }
}



// identify the currently logged in user
app.get('/api/v1/whoami', whoami);

// get all links
app.get('/api/v1/links', bodyParser.json(), assertLoggedIn, links.index.bind(null, Link));

// GET a given link
app.get('/api/v1/links/:id', bodyParser.json(), assertLoggedIn, links.get.bind(null, Link));

// create a new link
app.post('/api/v1/links', bodyParser.json(), assertLoggedIn, links.create.bind(null, Link));

// delete a link
app.delete('/api/v1/links/:id', assertLoggedIn, links.del.bind(null, Link));

// return the branches for a given repo
app.get('/api/v1/repos/:provider/:user/:repo', bodyParser.json(), assertLoggedIn, checkRepo);

// POST link updates
app.post('/api/v1/links/:linkId',
  bodyParser.json(),
  assertLoggedIn,
  links.update.bind(null, Link, Repository, addWebhooksForLink, removeOldWebhooksForLink)
);

// enable or disable a repository
app.post('/api/v1/link/:linkId/enable', bodyParser.json(), links.enable.bind(null, Link));

// the old webhook route
// This parses the body of the request to get most of its data.
app.post("/", bodyParser.json(), webhookOld.bind(null, webhook));

// the new webhook route
// No body parsing, all oauth-based
app.all('/_:linkId', webhook.bind(null, Link));

if (require.main === module) {
  let port = process.env.PORT || 8001;
  app.listen(port);
  console.log('Listening on port', port);
}
