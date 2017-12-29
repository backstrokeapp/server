import {paginateRequest} from '../helpers';

export default function checkRepo(req, res, GitHubApi) {
  const github = new GitHubApi({});
  github.authenticate({ type: 'oauth', token: req.user.accessToken });

  // Get repo details
  return github.repos.get({
    owner: req.params.user,
    repo: req.params.repo,
  }).then(repoData => {
    // Also get associated branches.
    return paginateRequest(github.repos.getBranches, {
      owner: req.params.user,
      repo: req.params.repo,
      per_page: 100,
    }).then(branches => {
      // format as a response
      res.status(200).send({
        valid: true,
        private: repoData.private,
        fork: repoData.fork,
        parent: repoData.parent ? {
          owner: repoData.parent.owner.login,
          name: repoData.parent.name,
          private: repoData.parent.private,
          defaultBranch: repoData.parent.default_branch,
        } : null,
        branches: branches.map(b => b.name),
      });
    });
  }).catch(err => {
    // repo doesn't exist.
    res.status(404).send({valid: false});
  });
}
