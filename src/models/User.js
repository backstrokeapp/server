export default function User(schema) {
  const User = schema.define('User', {
    username: String,
    email: String,
    picture: String,
    providerId: String,

    accessToken: String,
    refreshToken: String,
  });

  return User;
}
