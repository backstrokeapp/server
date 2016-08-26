import mongoose from 'mongoose';

const link = new mongoose.Schema({
  name: 'string',
  paid: 'boolean',
  enabled: 'boolean',
  owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  from: {type: mongoose.Schema.Types.ObjectId, ref: 'Repo'},
  to: {type: mongoose.Schema.Types.ObjectId, ref: 'Repo'},
});

link.methods.format = function format() {
  return Object.assign({}, this.toObject(), {user: undefined});
}

export default mongoose.model('Link', link);
