import GithubStrategy from 'passport-github2';

export default function strategy(User) {
  return new GithubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOne({provider_id: profile.id, provider: profile.provider}, (err, model) => {
        if (err) {
          return cb(err);
        } else if (model) {
					// update the refresh token provided
					User.update({_id: model._id}, {accessToken, refreshToken})
					.exec(err => cb(err, model));
        } else {
          return new User({
            accessToken, refreshToken,
            provider_id: profile.id,
            user: profile.username,
            provider: profile.provider,
            picture: profile._json.avatar_url,
            email: profile._json.email,
						customerId: null,
						subscriptionId: null,
          }).save(cb.bind(null, null));
        }
      });
    }
  );
}
