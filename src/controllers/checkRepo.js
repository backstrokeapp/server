import createGithubInstance from '../createGithubInstance';

export function checkRepo(req, res) {
  if (req.isAuthenticated()) {
    let gh = createGithubInstance(req.user);

    // Get repo details, and associated branches
    return gh.reposGet({
      user: req.params.user,
      repo: req.params.repo,
    }).then(repoData => {
      let branches = gh.reposGetBranches({
        user: req.params.user,
        repo: req.params.repo,
      });

      return Promise.all([repoData.private, repoData.fork, branches]);
    }).then(([_private, fork, branches]) => {
      // format as a response
      res.status(200).send({
        valid: true,
        private: _private,
        fork,
        branches: branches.map(b => b.name),
      });
    }).catch(err => {
      console.trace(err);
      res.status(404).send({valid: false});
    });
  } else {
    res.status(403).send({error: 'Please authenticate.'});
  }
}
