import GithubStrategy from 'passport-github2';

import Debug from 'debug';
const debug = Debug('backstroke:auth');

export default function strategy(User) {
  return new GithubStrategy({
		clientID: process.env.GITHUB_CLIENT_ID,
		clientSecret: process.env.GITHUB_CLIENT_SECRET,
		callbackURL: process.env.GITHUB_CALLBACK_URL,
	}, function(accessToken, refreshToken, profile, cb) {
		debug('PROVIDER ID %s', profile.id);

    // Register a new user.
    User.register(profile, accessToken).then(model => {
			debug('LOGGED IN USER %o', model);
			cb(null, model);
    }).catch(err => {
      if (err.name === 'ValidationError') {
        cb(JSON.stringify({ok: false, error: 'validation', context: err.context, issues: err.codes}));
      } else {
        cb(err);
      };
    });
	});
}
