import createGithubInstance from '../createGithubInstance';

export function getRepoName(name, _default=[null]) {
  if (name.indexOf('/') !== -1) {
    let split = name.split('/');
    return split.slice(0, 2);
  } else {
    return _default;
  }
}

// will a link be paid?
export default function isLinkPaid(user, link) {
  let gh = createGithubInstance(user);
  let checks = [];

  // always check `from`
  let [fromUser, fromRepo] = getRepoName(link.from.name);
  checks.push(gh.reposGet({user: fromUser, repo: fromRepo}));

  // need to check `to`?
  if (link.to.type === 'repo') {
    let [toUser, toRepo] = getRepoName(link.to.name);
    checks.push(gh.reposGet({user: toUser, repo: toRepo}));
  }

  // Get both of the repos
  return Promise.all(checks).then(all => {
    return all.some(a => a.private);
  });
}
