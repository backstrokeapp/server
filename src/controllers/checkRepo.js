import createGithubInstance from '../createGithubInstance';

export function checkRepo(req, res) {
  if (req.isAuthenticated()) {
    let gh = createGithubInstance(req.user);

    // Get repo details, and associated branches
    return gh.reposGet({
      owner: req.params.user,
      repo: req.params.repo,
    }).then(repoData => {
      return gh.reposGetBranches({
        owner: req.params.user,
        repo: req.params.repo,
        per_page: 100,
      }).then(branches => {
        // format as a response
        res.status(200).send({
          valid: true,
          private: repoData.private,
          fork: repoData.fork,
          branches: branches.map(b => b.name),
        });
      });
    }).catch(err => {
      // repo doesn't exist.
      res.status(404).send({valid: false});
    });
  } else {
    res.status(403).send({error: 'Please authenticate.'});
  }
}
