export default function Repository(schema) {
  const Repository = schema.define('Repository', {
    type: {type: String, enum: ['repo', 'all-forks']},
    owner: String,
    repo: String,
    fork: Boolean,
    html_url: String,
    branches: [String],
    branch: String,
  });

  return Repository;
}
