import GithubStrategy from 'passport-github2';

export default function strategy(User) {
  return new GithubStrategy({
		clientID: process.env.GITHUB_CLIENT_ID,
		clientSecret: process.env.GITHUB_CLIENT_SECRET,
		callbackURL: process.env.GITHUB_CALLBACK_URL,
	}, function(accessToken, refreshToken, profile, cb) {
		let user;

		// Is the user already in the system?
		User.findOne({
			where: {providerId: profile.id},
		}).then(model => {

			// Add the data fetched from this last request to the existing data, if it exists.
			user = Object.assign({}, model, {
				username: profile.username,
				email: profile._json.email,
				picture: profile._json.avatar_url,
				providerId: profile.id,
				accessToken,
				refreshToken,
			});

			return User.updateOrCreate(user);
		}).then(model => {
			cb(null, model);
		}).catch(cb);
	});
}
