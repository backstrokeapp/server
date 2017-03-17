import GithubStrategy from 'passport-github2';

export default function strategy(User) {
  return new GithubStrategy({
		clientID: process.env.GITHUB_CLIENT_ID,
		clientSecret: process.env.GITHUB_CLIENT_SECRET,
		callbackURL: process.env.GITHUB_CALLBACK_URL,
	}, function(accessToken, refreshToken, profile, a) {

		function cb(err, data) {
			console.log("CALLBACK", err, data);
			a(err, data);
		}

		User.findOne({
			where: {providerId: profile.id},
		}).then(model => {
			if (model) {
				// update with the new access and refresh tokens.
				console.log('update user', model, model.id);
				User.bulkUpdate({update: {accessToken, refreshToken}, where: {id: [model.id]}})
				.then(model => {
					console.log('success')
					cb(null, model);
				})
				.catch(cb);
			} else {
				// Otherwise, create a new user
				const user = new User({
					username: profile.username,
					email: profile._json.email,
					picture: profile._json.avatar_url,
					providerId: profile.id,
					accessToken,
					refreshToken,
				});

				user.save(err => {
					cb(err, user);
				});
			}
		}).catch(cb);
	});
}
