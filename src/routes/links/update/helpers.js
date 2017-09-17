import GitHubApi from 'github';

// Is the given user a collaborator or the given repository?
export async function isCollaboratorOfRepository(user, {owner, repo}) {
  const github = new GitHubApi({});
  github.authenticate({ type: "oauth", token: req.user.accessToken });

  try {
    await github.repos.checkCollaborator({
      owner: req.body.upstream.owner,
      repo: req.body.upstream.repo,
      username: req.user.username,
    });
    return true;
  } catch (err) {
    return false;
  }
}
