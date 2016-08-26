import mongoose from 'mongoose';

const repo = new mongoose.Schema({
  type: 'string',
  private: 'boolean',
  name: 'string',
  provider: {type: 'string', enum: ['github']},
  fork: 'boolean',
  html_url: 'string',
  branches: ['string'],
  branch: 'string',
});

export default mongoose.model('Repo', repo);
