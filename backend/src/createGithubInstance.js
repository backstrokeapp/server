import GitHubApi from 'github';
import {constructor} from './github';

// Authorize the bot.
const bot = new GitHubApi({});
bot.authenticate({
  type: "oauth",
  token: process.env.GITHUB_TOKEN,
});

// An express middleware that adds a github api instance to the request for the currently
// authenticated user. If no user is logged in, the property isn't set.
export default function authedGithubInstance(req, res, next) {
  req.github = {};

  // Add the bot api instance to the request.
  req.github.bot = bot;

  // If a user is logged in, create an add a user instance.
  if (req.user) {
    const github = new GitHubApi({});
    github.authenticate({
      type: "oauth",
      token: req.user.accessToken,
    });
    
    req.github.user = constructor(github);
  }
  return next();
}
