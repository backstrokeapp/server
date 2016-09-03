import mongoose from 'mongoose';

const user = new mongoose.Schema({
  accessToken: 'string',
  refreshToken: 'string',
  provider: 'string',
  picture: 'string',
  provider_id: 'string',
  user: 'string',
  email: 'string',
  customerId: 'string', // from stripe
  subscriptionId: 'string', // also from stripe
});

// user.static.

export default mongoose.model('User', user);
