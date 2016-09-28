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
import {getSubscriptionInformation, updatePaidLinks, addPaymentToUser} from 'controllers/payments';

import isLinkPaid from 'helpers/isLinkPaid';
import {addWebhooksForLink, removeOldWebhooksForLink} from 'helpers/addWebhooksForLink';

// ----------------------------------------------------------------------------
// Mongo stuff
// ----------------------------------------------------------------------------
import mongoose from 'mongoose';
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
mongoose.Promise = Promise;
import User from 'models/User';
import Link from 'models/Link';

// ----------------------------------------------------------------------------
// Setup mixpanel
// ----------------------------------------------------------------------------
import Mixpanel from 'mixpanel';
let mixpanel;
if (process.env.USE_MIXPANEL) {
  mixpanel = Mixpanel.init(process.env.USE_MIXPANEL);
}

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
  scope: ["repo", "write:repo_hook", "user:email"],
}));
app.get('/setup/login/public', passport.authenticate('github', {
  successRedirect: '/',
  failureRedirect: '/setup/login',
  scope: ["public_repo", "write:repo_hook", "user:email"],
}));

// Second leg of the auth
app.get("/auth/github/callback", passport.authenticate("github", {
  failureRedirect: '/setup/login',
}), (req, res) => {
  process.env.USE_MIXPANEL && mixpanel.people.set(req.user._id, {
    "$email": req.user.email,
    "$first_name": req.user.user,
    "have_payment": false,
    "are_paying": false,
  });
  process.env.USE_MIXPANEL && mixpanel.track('Logged In', {distinct_id: user._id});

  res.redirect('/#/links'); // on success
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
app.delete('/api/v1/links/:id', links.del.bind(null, Link, User, updatePaidLinks));

// return the branches for a given repo
app.get('/api/v1/repos/:provider/:user/:repo', bodyParser.json(), checkRepo);

// create a new link
app.post('/api/v1/links', bodyParser.json(), links.create.bind(null, Link));

// POST link updates
app.post('/api/v1/links/:linkId', bodyParser.json(),
  links.update.bind(null, Link, User, isLinkPaid, addWebhooksForLink, removeOldWebhooksForLink, updatePaidLinks));

// get the info to the currently subscribed plan
app.get('/api/v1/subscribed', getSubscriptionInformation);

// add a card to an account
// body: {"source": "tok_stripetoken", "email": "billing@email.com"}
app.post('/api/v1/payments', bodyParser.json(), addPaymentToUser.bind(null, User));

// enable or disable a repository
app.post('/api/v1/link/:linkId/enable', bodyParser.json(), links.enable.bind(null, Link, User, updatePaidLinks));

// the old webhook route
// This parses the body of the request to get most of its data.
app.post("/", bodyParser.json(), webhookOld);
app.route("/ping/github/:user/:repo").get((req, res) => {
  res.redirect(`https://github.com/${req.params.user}/${req.params.repo}`);
}).post(webhook);

// the new webhook route
// No body parsing, all oauth-based
app.all('/_:linkId', webhook.bind(null, Link));

// For letsencrypt
app.get('/.well-known/acme-challenge/:id', (req, res) =>
  res.status(200).send(process.env.LETSENCRYPT_ID)
);

let port = process.env.PORT || 8001;
app.listen(port);
console.log("Listening on port", port, "...");
