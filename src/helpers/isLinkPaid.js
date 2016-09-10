import createGithubInstance from '../createGithubInstance';
import getRepoName from 'helpers/getRepoName';
import Promise from 'bluebird';

// will a link be paid?
export default function isLinkPaid(user, link) {
  let gh = createGithubInstance(user);
  let checks = [];

  // always check `from`
  let [fromUser, fromRepo] = getRepoName(link.from);
  checks.push(gh.reposGet({user: fromUser, repo: fromRepo}));

  // need to check `to`?
  if (link.to.type === 'repo') {
    let [toUser, toRepo] = getRepoName(link.to);
    checks.push(gh.reposGet({user: toUser, repo: toRepo}));
  }

  // Get both of the repos
  return Promise.all(checks).then(all => {
    return all.some(a => a.private);
  });
}
