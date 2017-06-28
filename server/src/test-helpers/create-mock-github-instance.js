let _existingIds = [];
const MAX_ID = 10000000;
export function generateId() {
  let id;
  do {
    id = Math.floor(Math.random() * MAX_ID);
  } while (_existingIds.indexOf(id) !== -1);

  _existingIds.push(id);
  return id;
}

export function generateSha() {
  let sha = '';
  for (let i = 0; i <= 40; i++) {
    sha += String.fromCharCode(Math.floor(Math.random() * 25) + 97);
  }
  return sha;
}


export function generateOwner(owner, type="User") {
  let id = generateId();
  return {
    id,
    type,
    login: owner,
    avatar_url: `https://avatars0.githubusercontent.com/u/${id}?v=3`,
    site_admin: false,
  }
}

const BASE_REPO = {
  owner: 'foo',
  name: 'bar',
  isFork: false,
  branches: [
    {name: 'master', commit: {sha: generateSha()}},
  ],
};
export function generateRepo(addons) {
  let {owner, name, isFork, branches, forks, issues, pullRequests, webhooks, parent} = Object.assign({}, BASE_REPO, addons);
  let id = generateId();
  return {
    id,
    name,
    full_name: `${owner}/${name}`,
    owner: generateOwner(owner),
    parent,
    private: false,
    html_url: `https://github.com/${owner}/${name}`,
    description: "I am a mock repository created for testing purposes.",
    fork: isFork,
    url: `https://api.github.com/repos/${owner}/${name}`,
    stargazers_count: Math.floor(Math.random() * 500),
    watchers_count: Math.floor(Math.random() * 500),
    language: null,
    forks_count: (forks || []).length,
    forks: (forks || []).length,
    organization: generateOwner(owner),

    _branches: branches || [],
    _forks: forks || [],
    _issues: issues || [],
    _pullRequests: pullRequests || [],
    _webhooks: webhooks || [],
  };
}

export default function createMockGithubInstance(repoDirectory) {
  return {
    _repoDirectory: repoDirectory,

    reposGet({owner, repo}) {
      let r = repoDirectory.find(i => i.owner.login === owner && i.name === repo);
      if (r) {
        return Promise.resolve(r);
      } else {
        return Promise.reject(new Error(`No such repo ${owner}/${repo}`));
      }
    },
    reposGetBranches({owner, repo}) {
      let r = repoDirectory.find(i => i.owner.login === owner && i.name === repo);
      if (r) {
        return Promise.resolve(r._branches);
      } else {
        return Promise.reject(new Error(`No such repo ${owner}/${repo}`));
      }
    },
    reposGetForks({owner, repo}) {
      let r = repoDirectory.find(i => i.owner.login === owner && i.name === repo);
      if (r) {
        return Promise.resolve(r._forks);
      } else {
        return Promise.reject(new Error(`No such repo ${owner}/${repo}`));
      }
    },
    pullRequestsCreate({owner, repo, title, head, base, body, maintainer_can_modify}) {
      let r = repoDirectory.find(i => i.owner.login === owner && i.name === repo);
      if (r) {
        let doesPRAlreadyExist = r._pullRequests.find(i => i.head.label === head && i.base.label === base);
        if (doesPRAlreadyExist) {
          return Promise.reject({code: 422, error: 'Pull request already exists'});
        }

        let pr = {
          id: generateId(),
          number: Math.floor(Math.random() * 1000),
          state: "open",
          title,
          body,
          assignee: null,
          milestone: null,
          locked: false,
          created_at: (new Date()).toISOString(),
          updated_at: (new Date()).toISOString(),
          labels: [],
          head: {
            label: head,
            ref: head.split(':').reverse()[0],
            sha: generateSha(),
          },
          base: {
            label: base,
            ref: base.split(':').reverse()[0],
            sha: generateSha(),
          },
          user: null,
        };

        r._issues = [...r._issues, {
          id: pr.id,
          number: pr.number,
          state: pr.state,
          title: pr.title,
          body: pr.body,
          user: null,
          labels: [],
          locked: false,
          assignee: null,
          assignees: [],
          milestone: null,
          comments: 0,
          closed_at: null,
          pull_request: {
            url: `https://api.github.com/repos/1egoman/backstroke/pulls/${pr.number}`,
            html_url: `https://github.com/1egoman/backstroke/pull/${pr.number}`,
            diff_url: `https://github.com/1egoman/backstroke/pull/${pr.number}.diff`,
            patch_url: `https://github.com/1egoman/backstroke/pull/${pr.number}.patch`
          },
        }];

        r._pullRequests = [...r._pullRequests, pr];

        return Promise.resolve(pr);
      } else {
        return Promise.reject(new Error(`No such repo ${owner}/${repo}`));
      }
    },
    pullRequestsGetAll({owner, repo}) {
      let r = repoDirectory.find(i => i.owner.login === owner && i.name === repo);
      if (r) {
        return Promise.resolve(r._pullRequests);
      } else {
        return Promise.reject(new Error(`No such repo ${owner}/${repo}`));
      }
    },
    reposCreateHook({owner, repo, config, name, events}) {
      let r = repoDirectory.find(i => i.owner.login === owner && i.name === repo);
      if (r) {
        let webhook = {
          id: generateId(),
          name,
          events,
          active: true,
          config,
          created_at: (new Date()).toISOString(),
          updated_at: (new Date()).toISOString(),
        };
        r._webhooks = [...r._webhooks, webhook];
        return Promise.resolve(webhook);
      } else {
        return Promise.reject(new Error(`No such repo ${owner}/${repo}`));
      }
    },
    reposDeleteHook({owner, repo, id}) {
      let r = repoDirectory.find(i => i.owner.login === owner && i.name === repo);
      if (r) {
        let matchingWebhook = r._webhooks.findIndex(i => i.id === id);
        if (matchingWebhook >= 0) {
          r._webhooks.splice(matchingWebhook, 1);
          return Promise.resolve();
        } else {
          return Promise.reject(new Error(`No such webhook ${id} on repo ${owner}/${repo}`));
        }
      } else {
        return Promise.reject(new Error(`No such repo ${owner}/${repo}`));
      }
    },
    searchIssues({q}) {
      let matches = `${q} `.match(/(.+?):(.+?) /g);

      if (matches.length === 0) {
        return Promise.resolve(all);
      }

      // Get all issues from the list of repos, by concating them together.
      // Since we want to still have the context of the repo attaches to the issue, add the repo as
      // the _repo property on each issue to be referenced later.
      let allIssues = repoDirectory.reduce((acc, i) => [
        ...acc,
        ...i._issues.map(j => Object.assign({}, j, {_repo: i})),
      ], []);

      let items = matches.reduce((all, query) => {
        let [name, value] = query.trim().split(':');

        switch (name) {
          case 'repo': // repo:foo/bar
            let [owner, repo] = value.split('/');
            return all.filter(i => i._repo.owner.login === owner && i._repo.name === repo);
          case 'is': // is:pr
            if (value === 'pr') {
              return all.filter(i => !i.pull_request);
            } else if (value === 'issue') {
              return all.filter(i => i.pull_request);
            } else {
              return all;
            }
          case 'label': // label:my-custom-label
            return all.filter(i => i.labels.find(j => j.name === value));
          default:
            return all;
        }
      }, allIssues).map(i => {
        delete i._repo;
        return i;
      });

      return Promise.resolve({total_count: items.length, items});
    }
  };
}
