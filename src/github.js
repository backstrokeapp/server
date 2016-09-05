import Promise from 'bluebird';

export function constructor(github) {
  return {
    reposGet: Promise.promisify(github.repos.get),
    reposGetBranch: Promise.promisify(github.repos.getBranch),
    reposGetBranches: Promise.promisify(github.repos.getBranches),
    reposGetForks: Promise.promisify(github.repos.getForks),
    reposFork: Promise.promisify(github.repos.fork),
    reposEdit: Promise.promisify(github.repos.edit),
    reposDelete: Promise.promisify(github.repos['delete']),
    reposMerge: Promise.promisify(github.repos.merge),

    pullRequestsCreate: Promise.promisify(github.pullRequests.create),
    pullRequestsGetAll: Promise.promisify(github.pullRequests.getAll),
    pullRequestsMerge: Promise.promisify(github.pullRequests.merge),

    reposCreateHook: Promise.promisify(github.repos.createHook),
    reposFork: Promise.promisify(github.repos.fork),
    reposGetCollaborators: Promise.promisify(github.repos.getCollaborators),
    searchIssues: Promise.promisify(github.search.issues),
  };
}
