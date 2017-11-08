import {paginateRequest} from './helpers';

export default function checkRepo(req, res) {
  // Get repo details, and associated branches
  return req.github.user.reposGet({
    owner: req.params.user,
    repo: req.params.repo,
  }).then(repoData => {
    return paginateRequest(req.github.user.reposGetBranches, {
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
    }).catch(err => {
      throw err;
    });
  }).catch(err => {
    // repo doesn't exist.
    res.status(404).send({valid: false});
  });
}
