import fetch from 'node-fetch';

import Debug from 'debug';
const debug = Debug('backstroke:webhook:fetch-sha-for-upstream-branch');

export default async function fetchSHAForUpstreamBranch({
  id,
  owner,
  upstreamLastSHA,
  upstreamOwner,
  upstreamRepo,
  upstreamBranch,
}) {
  if (upstreamLastSHA) {
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
      debug('Link %o, Found commit hash on github page, so nothing changed.', id);
      return upstreamLastSHA;
    }
  }

  // Second check. If no definitive answer was found by looking at the github page, then make an api
  // call to github to figure it out.
  debug('Link %o, Falling back to proper api call...', id);

  // Fetch the latest commit in the branch `upstreamBranch`.
  let results = [];
  try {
    const resp = await fetch(`https://api.github.com/repos/${encodeURIComponent(upstreamOwner)}/${encodeURIComponent(upstreamRepo)}/commits`, {
      qs: {
        sha: upstreamBranch,
        per_page: 1,
        access_token: `token ${owner.accessToken}`,
      },
    });

    results = await resp.json();
  } catch (err) {
    throw new Error(`Repository ${upstreamOwner}/${upstreamRepo} does not exist. ERROR = '${err.toString()}'`);
    return null;
  }

  debug('Link %o, Response from getting HEAD of %o branch on %o/%o: %o', id, upstreamBranch, upstreamOwner, upstreamBranch, results);

  // The branch has no commits? No commit hash, so return null.
  if (results.length === 0) {
    return null;
  } else {
    // Return the HEAD commit hash for the upstream.
    return results[0].sha;
  }
}

