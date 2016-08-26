import mongoose from 'mongoose';

const RepoSchema = {
  type: {type: 'string'},
  private: 'boolean',
  name: 'string',
  provider: {type: 'string', enum: ['github']},
  fork: 'boolean',
  html_url: 'string',
  branches: ['string'],
  branch: 'string',
};

const link = new mongoose.Schema({
  name: 'string',
  paid: 'boolean',
  enabled: 'boolean',
  owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  from: RepoSchema,
  to: RepoSchema,
});

link.methods.format = function format() {
  return Object.assign({}, this.toObject(), {user: undefined});
}

export default mongoose.model('Link', link);
