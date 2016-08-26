import mongoose from 'mongoose';

const link = new mongoose.Schema({
  name: 'string',
  paid: 'boolean',
  enabled: 'boolean',
  from: {type: mongoose.Schema.Types.ObjectId, ref: 'Repo'},
  to: {type: mongoose.Schema.Types.ObjectId, ref: 'Repo'},
});

export default mongoose.model('Link', link);
