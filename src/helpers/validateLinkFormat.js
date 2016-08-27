import {Validator} from 'jsonschema';

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
  },
  required: ['enabled', 'to', 'from', 'name'],
};

export default function validateLinkFormat(link) {
  let validator = new Validator();
  return validator.validate(link, LINK_SCHEMA);
}
