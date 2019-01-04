# I don't have the bandwidth to maintain Backstroke anymore.

It's a project that has done fairly well, and many people use it and find it helpful. But, it's also a project that does too much for a single person to maintain, and it's got a number of moving parts that all have a tendency to break at the worst time (usually when I'm away from a computer). For a while, I found it fun to maintain, but over the past year it's turned into a chore, and I don't really have an interest in keeping it running.

Normally, when people shut things down, an alternative is usually provided. One alternative (found by @Freekers) is https://github.com/wei/pull, which looks pretty good - I'd recommend giving it a try. Another alternative if pull doesn't solve your problem is to set up a small server that either listens for a webhook (like backstroke classic) or polls the main branch on an upstream for changs. Then, use the Github API to create a new pull request. Backstroke classic, an example of this sort of approach, can be found here: https://github.com/backstrokeapp/legacy~

If anyone has an interest in taking over the project, please let me know. I'd be more than willing to pass it off to you and walk you through setting it up for development and deployment. If there isn't any interest, I'll likely shut it off later in the year once Backstroke's sponsored digitalocean credit runs out.

Sorry for this being so abrupt. To be honest, I've been thinking about doing this for a while and I should have been a bit more honest in mentioning this earlier.

- Ryan, @1egoman

---


![Backstroke](https://backstroke.us/assets/img/logo.png)
Backstroke
===
A Github bot to keep a fork updated with any changes made to its upstream. [Visit our Website](https://backstroke.co)

[![Website](https://img.shields.io/website-up-down-green-red/http/backstroke.co.svg?maxAge=2592000)](https://backstroke.co)

## Add Backstroke to a repository

1. Go to [backstroke.co](https://backstroke.co), and sign in with your Github account.
2. Click `Create new link`
3. Add a source repo under the text `Upstream`.
4. Select a destination repository - either all aforks of the upstream, or a particular form by
   clicking `one fork` and typing its name.
5. Click `Save`. If you push a change to the repo listed under `Upstream`, you'll
   get a pull request with any updates in the repo(s) under `Fork`!

## FAQ
- **I don't see any pull requests on the upstream....**: Pull requests are
  always proposed on forks. Take a look there instead.

- **I didn't sign up for this and now I'm getting pull requests. What's going on?**: Backstroke only creates pull requests in two cases:
  - A link was created by an upstream maintainer, and your fork has the `backstroke-sync` issue label on it. 
  - A link was created by a user that has write access on Github to the fork that syncs to the fork only.
  
  If you're receiving unsolicited pull requests and the `backstroke-sync` issue label hasn't been created on your fork, ensure that none of the contributors of your repository have added Backstroke to your fork. If you want some help, create an issue and we can figure out what's going on. We're really sorry that Backstroke could possibly create pull request spam - we've tried to build Backstroke in such a way where this shouldn't happen but sometimes we may have forgotten something or didn't consider a possible situation.

- **Why isn't Backstroke working?**: Take a look at the webhook response logs. Most likely, you'll see an error. Otherwise, open an issue.

- **Does Backstroke work outside of Github?**: Not yet.

-------
By [Ryan Gaus](http://rgaus.net)
