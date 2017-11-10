import GitHubApi from 'github';
import fetch from 'node-fetch';

// Is the given user a collaborator or the given repository?
export async function isCollaboratorOfRepository(user, {owner, repo}) {
  const github = new GitHubApi({});
  github.authenticate({ type: "oauth", token: user.accessToken });

  try {
    await github.repos.checkCollaborator({
      owner, repo,
      username: user.username,
    });
    return true;
  } catch (err) {
    return false;
  }
}

// Given a repository and a branch, return a page of commits at the start of the the branches
// history. This is accomplished by:
// 1. Fetching the page of commits (newest page). If length < page size, then return this as the response.
// 2. Look at Link header; Parse with a regular expression to extract the number of pages in the
// response.
// 3. Fetch the last page of data, return from the function.
export async function getGenesisHistory(user, owner, repo, branch) {
  const github = new GitHubApi({});
  github.authenticate({ type: "oauth", token: user.accessToken });


  // Get the number of pages of commits
  const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}`, {
    method: 'HEAD',
    headers: {
      'Authorization': `Bearer ${user.accessToken}`,
    },
  });

  if (!resp) {
    throw new Error(`No such repository found: ${owner}/${repo}`);
  }

  // Attempt to get the page from the request's response. If no `Link` header can be found to
  // extract the length from, then the response isn't paginated.
  let pageCount = 1;
  const linkHeader = resp.headers.get('Link');
  if (linkHeader) {
    const linkMatch = linkHeader.match(/page=([0-9]+)>; rel="last"/);
    pageCount = linkMatch ? parseInt(linkMatch[1], 10) : -1;
  }
  
  if (pageCount < 0) {
    throw new Error(`No link header returned with get commits response for repo ${owner}/${repo}`);
  }
  
  const commits = await github.repos.getCommits({
    owner,
    repo,
    sha: branch,
    page: pageCount,
  });
  
  if (commits) {
    return commits.reverse();
  } else {
    throw new Error(`No commits found on page ${pageCount} for repo ${owner}/${repo}`);
  }
}
