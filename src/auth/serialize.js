// Attach serialization to the user
export default function userSerialization(User, passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function(id, done) {
    User.findById(id)
      .then(model => done(null, model))
      .catch(err => done(err));
  });
}
