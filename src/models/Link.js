import mongoose from 'mongoose';
import {Validator} from 'jsonschema';


// ----------------------------------------------------------------------------
// JSON schema version of a link
// ----------------------------------------------------------------------------
let repo = {
  type: 'object',
  properties: {
    private: {type: 'boolean'},
    name: {type: 'string', pattern: '(.+)\/(.+)'},
    provider: {
      type: 'string',
      enum: ['github'],
    },
    fork: {type: 'boolean'},
    branch: {type: 'string'},
    branches: {type: 'array', items: {type: 'string'}},
    type: {type: 'string', pattern: "repo"},
  },
  required: ['private', 'name', 'provider', 'fork', 'branches', 'branch', 'type'],
};

let forks = {
  type: 'object',
  properties: {
    type: {type: 'string', pattern: 'fork-all'},
    provider: {type: 'string', pattern: 'github'},
  },
  required: ['type', 'provider'],
};

const LINK_SCHEMA = {
  type: 'object',
  properties: {
    enabled: {type: 'boolean'},
    name: {type: 'string'},
    paid: {type: 'boolean'}, // will be overriden, so not required
    from: repo,
    to: {oneOf: [repo, forks]},

    ephemeralRepo: {type: 'boolean'},
  },
  required: ['enabled', 'to', 'from', 'name'],
};

// ----------------------------------------------------------------------------
// Mongoose schema
// ----------------------------------------------------------------------------
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

  ephemeralRepo: 'boolean',
});

link.methods.format = function format() {
  return Object.assign({}, this.toObject(), {user: undefined});
}

link.statics.isValidLink = function isValidLink(link) {
  let validator = new Validator();
  return validator.validate(link, LINK_SCHEMA);
}

// Given a link, return its price.
link.statics.price = function price(link) {
  return link.paid ? 1.00 : 0;
}

export default mongoose.model('Link', link);
