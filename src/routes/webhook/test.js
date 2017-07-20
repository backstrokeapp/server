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
  it('should create a pull request when given a single fork', async () => {
    const searchIssues = sinon.stub().resolves({total_count: 0, issues: []});
    const pullRequestsCreate = sinon.stub().resolves('pull request response');

    const user = await User.create({username: 'ryan'});
    const upstream = await Repository.create({type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'});
    const fork = await Repository.create({type: 'repo', owner: 'hello', repo: 'world', branch: 'master'});

    const link = await Link.create({
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner: user.id,
      upstream: upstream.id,
      fork: fork.id,
    });

    return webhook({
      github: {
        user: {
          searchIssues,
        },
        bot: {
          pullRequestsCreate,
        },
      }
    }, link).then(resp => {
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
  it('should create a pull request on each fork when given a bunch of forks', async () => {
    const reposGetForks = sinon.stub().withArgs({owner: 'foo', repo: 'bar'}).resolves([
      {owner: {login: 'hello'}, name: 'world'},
      {owner: {login: 'another'}, name: 'repo'},
    ]);
    const searchIssues = sinon.stub().resolves({total_count: 0, issues: []});
    const pullRequestsCreate = sinon.stub().resolves('pull request response');

    const user = await User.create({username: 'ryan'});
    const upstream = await Repository.create({ 
      type: 'repo',
      owner: 'foo',
      repo: 'bar',
      branch: 'master'
    });
    const fork = await Repository.create({type: 'fork-all'}); // Fork
     
    const link = await Link.create({
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner: user.id,
      upstream: upstream.id,
      fork: fork.id,
    });

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
    }, link).then(resp => {
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
  it('should try to make a PR to a single fork of an upstream, but the repo opted out', async () => {
    const searchIssues = sinon.stub().resolves({total_count: 1, issues: [
      {title: 'opted out!', labels: [{name: 'optout'}]},
    ]});
    const pullRequestsCreate = sinon.stub().resolves('pull request response');

    const user = await User.create({username: 'ryan'});
    const upstream = await Repository.create({type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'});
    const fork = await Repository.create({type: 'repo', owner: 'hello', repo: 'world', branch: 'master'});

    const link = await Link.create({
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner: user.id,
      upstream: upstream.id,
      fork: fork.id,
    });

    return webhook({
      github: {
        user: {
          searchIssues,
        },
        bot: {
          pullRequestsCreate,
        },
      }
    }, link).catch(err => {
      assert.equal(err.message, 'This repo opted out of backstroke pull requests');
    });
  });
  it('should try to make a PR to a single fork of an upstream, but a pull request already exists', async () => {
    const searchIssues = sinon.stub().resolves({total_count: 0, issues: []});
    const pullRequestsCreate = sinon.stub().rejects({code: 422}); // PR already exists

    const user = await User.create({username: 'ryan'});
    const upstream = await Repository.create({type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'});
    const fork = await Repository.create({type: 'repo', owner: 'hello', repo: 'world', branch: 'master'});

    const link = await Link.create({
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner: user.id,
      upstream: upstream.id,
      fork: fork.id,
    });

    return webhook({
      github: {
        user: {
          searchIssues,
        },
        bot: {
          pullRequestsCreate,
        },
      }
    }, link).catch(err => {
      assert.equal(err.message, `There's already a pull request on hello/world.`);
    });
  });
  it('should make a PR to a single fork of an upstream, but the link is disabled', async () => {
    const link = await Link.create({
      name: 'My Link',
      enabled: false,
      hookId: ['123456'],
      owner: null,
      upstream: null,
      fork: null,
    });

    return webhook({}, link).then(resp => {
      assert.deepEqual(resp, {error: 'not-enabled', isEnabled: false});
    });
  });
  it('should make a PR to a single fork of an upstream, but upstream / fork are null', async () => {
    const link = await Link.create({
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner: null,
      upstream: null,
      fork: null,
    });

    return webhook({}, link).then(resp => {
      assert.deepEqual(resp, {
        error: 'upstream-or-fork-false',
        isEnabled: true,
        msg: 'Please set both a "upstream" and "fork" on this link.',
      });
    });
  });
});
