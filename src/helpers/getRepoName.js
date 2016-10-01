// Given a repo , try to return the username and repo contained within
export default function getRepoName(repo, _default=[null]) {
  if (repo.name.indexOf('/') !== -1) {
    let split = repo.name.split('/');
    return split.slice(0, 2);
  } else {
    return _default;
  }
}

