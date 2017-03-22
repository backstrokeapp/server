import GithubStrategy from 'passport-github2';

import Debug from 'debug';
const debug = Debug('backstroke:auth');

export default function strategy(User) {
  return new GithubStrategy({
		clientID: process.env.GITHUB_CLIENT_ID,
		clientSecret: process.env.GITHUB_CLIENT_SECRET,
		callbackURL: process.env.GITHUB_CALLBACK_URL,
	}, function(accessToken, refreshToken, profile, cb) {
		let user;

		// Is the user already in the system?
		User.findOne({
			where: {providerId: profile.id.toString()},
		}).then(model => {
			debug('USER FOUND %o', model);

			// Add the data fetched from this last request to the existing data, if it exists.
			user = Object.assign({}, model, {
				username: profile.username,
				email: profile._json.email,
				picture: profile._json.avatar_url,
				providerId: profile.id,
				accessToken,
				refreshToken,
			});

			if (model) {
				debug('UPDATING USER MODEL %o WITH %o', model, user);
				return model.updateAttributes(user);
			} else {
				debug('CREATE USER %o', user);
				return User.create(user);
			}
		}).then(model => {
			cb(null, model);
		}).catch(cb);
	});
}
