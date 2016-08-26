import mongoose from 'mongoose';

const user = new mongoose.Schema({
  accessToken: 'string',
  refreshToken: 'string',
  provider: 'string',
  picture: 'string',
});

export default mongoose.model('User', user);
