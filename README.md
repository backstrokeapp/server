![Backstroke](https://backstroke.us/assets/img/logo.png)
Backstroke
===
A Github bot to keep a fork updated with any changes made to its upstream. [Visit our Website](https://backstroke.co)

[![Build Status](https://travis-ci.org/1egoman/backstroke.svg?branch=master)](https://travis-ci.org/1egoman/backstroke)
[![Gratipay Team](https://img.shields.io/gratipay/team/Backstroke.svg?maxAge=2592001)](https://gratipay.com/Backstroke/)
[![Website](https://img.shields.io/website-up-down-green-red/http/backstroke.co.svg?maxAge=2592000)](https://backstroke.us)

[![Support via Gratipay](https://cdn.rawgit.com/gratipay/gratipay-badge/2.3.0/dist/gratipay.svg)](https://gratipay.com/Backstroke/)

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
  - A link was created by an upstrema maintainer, and your fork has the `backstroke-sync` issue label on it. 
  - A link was created by a user that has write access on Github to the fork that syncs to the fork only.
  
  If you're receiving unsolicited pull requests and the `backstroke-sync` issue label hasn't been created on your fork, ensure that none of the contributors of your repository have added Backstroke to your fork. If you want some help, create an issue and we can figure out what's going on. We're really sorry is Backstroke creates pull request spam - we've tried to build Backstroke in such a way where this shouldn't happen but sometimes we may have forgotten something or didn't consider a possible situation.

- **Why isn't Backstroke working?**: Take a look at the webhook response logs. Most likely, you'll see an error. Otherwise, open an issue.

- **Does Backstroke work outside of Github?**: Not yet.

-------
By [Ryan Gaus](http://rgaus.net)
