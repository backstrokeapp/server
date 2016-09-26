import GitHubApi from 'github';
import * as ghFactory from './github';

// configure github api client
export default function authedGithubInstance(user) {
  let github = new GitHubApi({});
  github.authenticate({
    type: "oauth",
    token: user.accessToken,
  });
  return ghFactory.constructor(github);
}
