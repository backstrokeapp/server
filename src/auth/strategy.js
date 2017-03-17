import GithubStrategy from 'passport-github2';

export default function strategy(User) {
  return new GithubStrategy({
		clientID: process.env.GITHUB_CLIENT_ID,
		clientSecret: process.env.GITHUB_CLIENT_SECRET,
		callbackURL: process.env.GITHUB_CALLBACK_URL,
	}, function(accessToken, refreshToken, profile, a) {
		let user;

		function cb(err, data) {
			console.log("CALLBACK", err, data);
			a(err, data);
		}

		User.findOne({
			where: {providerId: profile.id},
		}).then(model => {
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
