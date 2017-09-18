import GitHubApi from 'github';

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
