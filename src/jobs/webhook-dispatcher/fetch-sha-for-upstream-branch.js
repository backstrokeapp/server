import fetch from 'node-fetch';
import GithubApi from 'github';

import Debug from 'debug';
const debug = Debug('backstroke:webhook:fetch-sha-for-upstream-branch');

export default async function fetchSHAForUpstreamBranch({
  owner,
  upstreamLastSHA,
  upstreamOwner,
  upstreamRepo,
  upstreamBranch,
}) {
  // Get the short version of the sha
  const upstreamLastSHAShort = upstreamLastSHA ? upstreamLastSHA.slice(0, 8) : null;

  // First check. Search for the short versino of the last sha on the github repo page. The hope
  // here is to avoid having to use a query with the api token if not required.
  const foundLastSHAOnPage = await fetch(
    `https://github.com/${upstreamOwner}/${upstreamRepo}/tree/${upstreamBranch}`
  ).then(async resp => {
    if (resp.ok) {
      return resp.text().catch(err => null).then(data => {
        // Search for the sha in the return from the github page. If it's found, then we know that
        // it's the latest commit.
        return data.indexOf(upstreamLastSHAShort) >= 0;
      });
    } else {
      return null;
    }
  });

  if (foundLastSHAOnPage) {
    debug('Found commit hash on github page, so nothing changed.');
    return upstreamLastSHA;
  }

  // Second check. If no definitive answer was found by looking at the github page, then make an api
  // call to github to figure it out.
  debug('Falling back to proper api call...');
  const github = new GithubApi();
  github.authenticate({ type: 'token', token: owner.accessToken });

  // Fetch the latest commit in the branch `upstreamBranch`.
  try {
    const results = await github.repos.getCommits({
      owner: upstreamOwner,
      repo: upstreamRepo,
      sha: upstreamBranch,
      per_page: 1,
    });
  } catch (err) {
    throw new Error(`Repository ${upstreamOwner}/${upstreamRepo} does not exist. ${err}`);
    return false;
  }

  // The branch has no commits? No commit hash, so return null.
  if (results.length === 0) {
    return null;
  } else {
    // Return the HEAD commit hash for the upstream.
    return results[0].sha;
  }
}
