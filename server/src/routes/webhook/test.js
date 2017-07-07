import webhook, {didRepoOptOut} from './handler';
import assert from 'assert';
import sinon from 'sinon';

// Helper for mounting routes in an express app and querying them.
import issueRequest from '../../test-helpers/issue-request';
import MockModel from '../../test-helpers/mock-model';

const User = new MockModel(),
      Repository = new MockModel(),
      Link = new MockModel([], {upstream: Repository, owner: User, fork: Repository});

Link.methods.display = function() { return this; }

describe('webhook', () => {

  it('should create a pull request when given a single fork', function() {
    let userData, upstreamData, forkData;

    const searchIssues = sinon.stub().resolves({total_issues: 0, issues: []});
    const pullRequestsCreate = sinon.stub().resolves('pull request response');

    return Promise.all([
      User.create({username: 'ryan'}),
      Repository.create({type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'}), // Upstream
      Repository.create({type: 'repo', owner: 'hello', repo: 'world', branch: 'master'}), // Fork
    ]).then(([user, upstream, fork]) => {
      userData = user;
      upstreamData = upstream;
      forkData = fork;
      return Link.create({
        name: 'My Link',
        enabled: true,
        hookId: ['123456'],
        owner: user.id,
        upstream: upstream.id,
        fork: fork.id,
      });
    }).then(link => {
      return webhook({
        github: {
          user: {
            searchIssues,
          },
          bot: {
            pullRequestsCreate,
          },
        }
      }, link);
    }).then(resp => {
      assert.deepEqual(resp, {
        status: 'ok',
        pullRequest: 'pull request response',
        forkCount: 1,
        many: false,
        isEnabled: true,
      });

      assert.deepEqual(pullRequestsCreate.firstCall.args, [
        {
          base: "master",
          body: "Hello!  The remote `foo/bar` has some new changes that aren't in this fork.\n  So, here they are, ready to be merged! :tada:\n\n  If this pull request can be merged without conflict, you can publish your software\n  with these new changes. Otherwise, fix any merge conflicts by clicking the `Resolve Conflicts`\n  button.\n\n  Have fun!\n  --------\n  Created by [Backstroke](http://backstroke.us). Oh yea, I'm a bot.\n  ",
          head: "foo:master",
          maintainer_can_modify: false,
          owner: "hello",
          repo: "world",
          title: "Update from upstream repo foo/bar",
        },
      ]);
    });
  });
  it('should create a pull request on each fork when given a bunch of forks', function() {
    let userData, upstreamData, forkData;

    const reposGetForks = sinon.stub().withArgs({owner: 'foo', repo: 'bar'}).resolves([
      {owner: {login: 'hello'}, name: 'world'},
      {owner: {login: 'another'}, name: 'repo'},
    ]);
    const searchIssues = sinon.stub().resolves({total_issues: 0, issues: []});
    const pullRequestsCreate = sinon.stub().resolves('pull request response');

    return Promise.all([
      User.create({username: 'ryan'}),
      Repository.create({type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'}), // Upstream
      Repository.create({type: 'fork-all'}), // Fork
    ]).then(([user, upstream, fork]) => {
      userData = user;
      upstreamData = upstream;
      return Link.create({
        name: 'My Link',
        enabled: true,
        hookId: ['123456'],
        owner: user.id,
        upstream: upstream.id,
        fork: fork.id,
      });
    }).then(link => {
      return webhook({
        github: {
          user: {
            searchIssues,
            reposGetForks,
          },
          bot: {
            pullRequestsCreate,
          },
        }
      }, link);
    }).then(resp => {
      assert.deepEqual(resp, {
        status: 'ok',
        forkCount: 2,
        many: true,
        isEnabled: true,
      });

      assert.deepEqual(pullRequestsCreate.firstCall.args, [
        {
          base: "master",
          body: "Hello!  The remote `foo/bar` has some new changes that aren't in this fork.\n  So, here they are, ready to be merged! :tada:\n\n  If this pull request can be merged without conflict, you can publish your software\n  with these new changes. Otherwise, fix any merge conflicts by clicking the `Resolve Conflicts`\n  button.\n\n  Have fun!\n  --------\n  Created by [Backstroke](http://backstroke.us). Oh yea, I'm a bot.\n  ",
          head: "foo:master",
          maintainer_can_modify: false,
          owner: "hello",
          repo: "world",
          title: "Update from upstream repo foo/bar",
        },
      ]);
      assert.deepEqual(pullRequestsCreate.secondCall.args, [
        {
          base: "master",
          body: "Hello!  The remote `foo/bar` has some new changes that aren't in this fork.\n  So, here they are, ready to be merged! :tada:\n\n  If this pull request can be merged without conflict, you can publish your software\n  with these new changes. Otherwise, fix any merge conflicts by clicking the `Resolve Conflicts`\n  button.\n\n  Have fun!\n  --------\n  Created by [Backstroke](http://backstroke.us). Oh yea, I'm a bot.\n  ",
          head: "foo:master",
          maintainer_can_modify: false,
          owner: "another",
          repo: "repo",
          title: "Update from upstream repo foo/bar",
        },
      ]);
    });
  });

  // it('should try to make a PR to a single fork of an upstream, but the repo opted out', () => {
  //   const upstream = generateRepo({
  //     owner: 'upstream', name: 'my-app',
  //     default_branch: 'master',
  //     branches: ['master'],
  //     issues: [],
  //   });
  //   const fork = generateRepo({
  //     owner: 'fork', name: 'my-app',
  //     default_branch: 'master',
  //     branches: ['master'],
  //     issues: [
  //       {name: "My PR", labels: [{name: 'optout', id: generateId()}]},
  //     ],
  //   });
  //   const gh = createMockGithubInstance([upstream, fork]);
  //
  //   const upstreamId = generateId(),
  //         forkId = generateId();
  //   const link = {
  //     enabled: true,
  //     upstreamId,
  //     upstream: () => Promise.resolve({
  //       id: upstreamId,
  //       type: 'repo',
  //       owner: upstream.owner.login,
  //       repo: upstream.name,
  //       branch: 'master',
  //     }),
  //     forkId,
  //     fork: () => Promise.resolve({
  //       id: forkId,
  //       type: 'repo',
  //       owner: fork.owner.login,
  //       repo: fork.name,
  //       branch: 'master',
  //     }),
  //   };
  //
  //   return webhook(gh, link, undefined, gh).then(output => {
  //     assert.deepEqual(output, {
  //       status: 'ok',
  //       pullRequest: {msg: 'This repo opted out of backstroke pull requests'},
  //       isEnabled: true,
  //       many: false,
  //       forkCount: 1,
  //     });
  //   });
  // });
  // it('should try to make a PR to a single fork of an upstream, but a pull request already exists', () => {
  //   const upstream = generateRepo({
  //     owner: 'upstream', name: 'my-app',
  //     default_branch: 'master',
  //     branches: ['master'],
  //     issues: [],
  //   });
  //   const fork = generateRepo({
  //     owner: 'fork', name: 'my-app',
  //     default_branch: 'master',
  //     branches: ['master'],
  //     pullRequests: [
  //       {
  //         id: generateId(),
  //         number: 42,
  //         state: 'open',
  //         title: 'My PR', 
  //         body: '(This pull request already was made by backstroke previously.)',
  //         labels: [],
  //         head: {
  //           label: 'upstream:master',
  //         },
  //         base: {
  //           label: 'master',
  //         }
  //       },
  //     ],
  //   });
  //   const gh = createMockGithubInstance([upstream, fork]);
  //
  //   const upstreamId = generateId(),
  //         forkId = generateId();
  //   const link = {
  //     enabled: true,
  //     upstreamId,
  //     upstream: () => Promise.resolve({
  //       id: upstreamId,
  //       type: 'repo',
  //       owner: upstream.owner.login,
  //       repo: upstream.name,
  //       branch: 'master',
  //     }),
  //     forkId,
  //     fork: () => Promise.resolve({
  //       id: forkId,
  //       type: 'repo',
  //       owner: fork.owner.login,
  //       repo: fork.name,
  //       branch: 'master',
  //     }),
  //   };
  //
  //   return webhook(gh, link, undefined, gh).then(output => {
  //     assert.deepEqual(output, {
  //       status: 'ok',
  //       pullRequest: {msg: `There's already a pull request on fork/my-app.`},
  //       isEnabled: true,
  //       many: false,
  //       forkCount: 1,
  //     });
  //   });
  // });
  // it('should make a PR to a single fork of an upstream, but the link is disabled', () => {
  //   const upstream = generateRepo({
  //     owner: 'upstream', name: 'my-app',
  //     default_branch: 'master',
  //     branches: ['master'],
  //   });
  //   const fork = generateRepo({
  //     owner: 'fork', name: 'my-app',
  //     default_branch: 'master',
  //     branches: ['master'],
  //   });
  //   const gh = createMockGithubInstance([upstream, fork]);
  //
  //   const upstreamId = generateId(),
  //         forkId = generateId();
  //   const link = {
  //     enabled: false,
  //     upstreamId,
  //     upstream: () => Promise.resolve({
  //       id: upstreamId,
  //       type: 'repo',
  //       owner: upstream.owner.login,
  //       repo: upstream.name,
  //       branch: 'master',
  //     }),
  //     forkId,
  //     fork: () => Promise.resolve({
  //       id: forkId,
  //       type: 'repo',
  //       owner: fork.owner.login,
  //       repo: fork.name,
  //       branch: 'master',
  //     }),
  //   };
  //
  //   return webhook(gh, link, undefined, gh).then(output => {
  //     assert.deepEqual(output, {
  //       error: 'not-enabled',
  //       isEnabled: false,
  //     });
  //   });
  // });
  // it('should make a PR to a single fork of an upstream, but upstream / fork are null', () => {
  //   const upstream = generateRepo({
  //     owner: 'upstream', name: 'my-app',
  //     default_branch: 'master',
  //     branches: ['master'],
  //   });
  //   const fork = generateRepo({
  //     owner: 'fork', name: 'my-app',
  //     default_branch: 'master',
  //     branches: ['master'],
  //   });
  //   const gh = createMockGithubInstance([upstream, fork]);
  //
  //   const link = {
  //     enabled: true,
  //     upstreamId: null,
  //     upstream: () => Promise.resolve(null),
  //     forkId: null,
  //     fork: () => Promise.resolve(null),
  //   };
  //
  //   return webhook(gh, link, undefined, gh).then(output => {
  //     assert.deepEqual(output, {
  //       error: 'upstream-or-fork-false',
  //       isEnabled: true,
  //       msg: 'Please set both a "upstream" and "fork" on this link.',
  //     });
  //   });
  // });
  // it('should not run a disabled webhook', () => {
  //   const link = {
  //     enabled: false,
  //   };
  //   const gh = createMockGithubInstance([]);
  //
  //   return webhook(gh, link, undefined, gh).then(output => {
  //     assert.deepEqual(output, {
  //       error: 'not-enabled',
  //       isEnabled: false,
  //     });
  //   });
  // });
});
