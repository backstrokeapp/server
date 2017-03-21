import {Schema} from 'jugglingdb';

export default function Repository(schema) {
  const Repository = schema.define('Repository', {
    type: {type: String, enum: ['repo', 'all-forks']},
    owner: String,
    repo: String,
    fork: Boolean,
    html_url: String,
    // branches: {type: String, default: new Array()}, // Array of strings
    branches: Schema.JSON,
    branch: String,
  });

  return Repository;
}
