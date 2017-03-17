import mongoose from 'mongoose';

const user = new mongoose.Schema({
  accessToken: 'string',
  refreshToken: 'string',

  user: 'string',
  email: 'string',
  provider: 'string',
  picture: 'string',
  provider_id: 'string',

  customerId: 'string', // from stripe
  subscriptionId: 'string', // also from stripe
});

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
