export default function Repository(schema) {
  const Repository = schema.define('Repository', {
    type: String,
    owner: String,
    repo: String,
    fork: Boolean,
    html_url: String,
    branches: Array(String),
    branch: String,
  });

  return Repository;
}
