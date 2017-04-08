import createMockGithubInstance, {
  generateId,
  generateOwner,
  generateRepo,
} from './helpers/createMockGithubInstance';

import webhook, {didRepoOptOut} from '../src/webhook';
import assert from 'assert';

describe('didRepoOptOut', () => {
  it('should make sure a repo is by default not opted out', () => {
    let repository = generateRepo({
      issues: [],
    });
    const gh = createMockGithubInstance([repository]);

    return didRepoOptOut(gh, {owner: repository.owner.login, repo: repository.name}).then(optout => {
      assert.equal(optout, false);
    });
  });
  it('should make sure a repo is opted out when it has the right labels on a PR', () => {
    let repository = generateRepo({
      issues: [
        {
          title: "My sample PR",
          labels: [
            {id: generateId(), name: "optout"},
          ],
        },
      ],
    });
    const gh = createMockGithubInstance([repository]);

    return didRepoOptOut(gh, {owner: repository.owner.login, repo: repository.name}).then(optout => {
      assert.equal(optout, true);
    });
  });
});

describe('webhook', () => {
  it('should make a PR to all forks of an upstream', () => {
    const fork = generateRepo({
      owner: 'upstream', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [],
    });
    const upstream = generateRepo({
      owner: 'fork', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [],
      forks: [fork],
    });
    const gh = createMockGithubInstance([upstream, fork]);

    const upstreamId = generateId(),
          forkId = generateId();
    const link = {
      enabled: true,
      upstreamId,
      upstream: () => Promise.resolve({
        id: upstreamId,
        type: 'repo',
        owner: upstream.owner.login,
        repo: upstream.name,
        branch: 'master',
      }),
      forkId,
      fork: () => Promise.resolve({
        id: forkId,
        type: 'fork-all',
      }),
    };

    return webhook(gh, link, undefined, gh).then(output => {
      assert.deepEqual(output, {
        status: 'ok',
        many: true,
        forkCount: 1,
        isEnabled: true,
      });
    });
  });
  it('should make a PR to a single fork of an upstream', () => {
    const upstream = generateRepo({
      owner: 'upstream', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [],
    });
    const fork = generateRepo({
      owner: 'fork', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [],
    });
    const gh = createMockGithubInstance([upstream, fork]);

    const upstreamId = generateId(),
          forkId = generateId();
    const link = {
      enabled: true,
      upstreamId,
      upstream: () => Promise.resolve({
        id: upstreamId,
        type: 'repo',
        owner: upstream.owner.login,
        repo: upstream.name,
        branch: 'master',
      }),
      forkId,
      fork: () => Promise.resolve({
        id: forkId,
        type: 'repo',
        owner: fork.owner.login,
        repo: fork.name,
        branch: 'master',
      }),
    };

    return webhook(gh, link, undefined, gh).then(optout => {
      assert.equal(optout.status, 'ok');
      assert.equal(optout.isEnabled, true);
      assert.equal(optout.many, false);
      assert.equal(optout.forkCount, 1);
    });
  });
  it('should try to make a PR to a single fork of an upstream, but the repo opted out', () => {
    const upstream = generateRepo({
      owner: 'upstream', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [],
    });
    const fork = generateRepo({
      owner: 'fork', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [
        {name: "My PR", labels: [{name: 'optout', id: generateId()}]},
      ],
    });
    const gh = createMockGithubInstance([upstream, fork]);

    const upstreamId = generateId(),
          forkId = generateId();
    const link = {
      enabled: true,
      upstreamId,
      upstream: () => Promise.resolve({
        id: upstreamId,
        type: 'repo',
        owner: upstream.owner.login,
        repo: upstream.name,
        branch: 'master',
      }),
      forkId,
      fork: () => Promise.resolve({
        id: forkId,
        type: 'repo',
        owner: fork.owner.login,
        repo: fork.name,
        branch: 'master',
      }),
    };

    return webhook(gh, link, undefined, gh).then(output => {
      assert.deepEqual(output, {
        status: 'ok',
        pullRequest: {msg: 'This repo opted out of backstroke pull requests'},
        isEnabled: true,
        many: false,
        forkCount: 1,
      });
    });
  });
  it('should try to make a PR to a single fork of an upstream, but a pull request already exists', () => {
    const upstream = generateRepo({
      owner: 'upstream', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [],
    });
    const fork = generateRepo({
      owner: 'fork', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      pullRequests: [
        {
          id: generateId(),
          number: 42,
          state: 'open',
          title: 'My PR', 
          body: '(This pull request already was made by backstroke previously.)',
          labels: [],
          head: {
            label: 'upstream:master',
          },
          base: {
            label: 'master',
          }
        },
      ],
    });
    const gh = createMockGithubInstance([upstream, fork]);

    const upstreamId = generateId(),
          forkId = generateId();
    const link = {
      enabled: true,
      upstreamId,
      upstream: () => Promise.resolve({
        id: upstreamId,
        type: 'repo',
        owner: upstream.owner.login,
        repo: upstream.name,
        branch: 'master',
      }),
      forkId,
      fork: () => Promise.resolve({
        id: forkId,
        type: 'repo',
        owner: fork.owner.login,
        repo: fork.name,
        branch: 'master',
      }),
    };

    return webhook(gh, link, undefined, gh).then(output => {
      assert.deepEqual(output, {
        status: 'ok',
        pullRequest: {msg: `There's already a pull request on fork/my-app.`},
        isEnabled: true,
        many: false,
        forkCount: 1,
      });
    });
  });
  it('should make a PR to a single fork of an upstream, but the link is disabled', () => {
    const upstream = generateRepo({
      owner: 'upstream', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
    });
    const fork = generateRepo({
      owner: 'fork', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
    });
    const gh = createMockGithubInstance([upstream, fork]);

    const upstreamId = generateId(),
          forkId = generateId();
    const link = {
      enabled: false,
      upstreamId,
      upstream: () => Promise.resolve({
        id: upstreamId,
        type: 'repo',
        owner: upstream.owner.login,
        repo: upstream.name,
        branch: 'master',
      }),
      forkId,
      fork: () => Promise.resolve({
        id: forkId,
        type: 'repo',
        owner: fork.owner.login,
        repo: fork.name,
        branch: 'master',
      }),
    };

    return webhook(gh, link, undefined, gh).then(output => {
      assert.deepEqual(output, {
        error: 'not-enabled',
        isEnabled: false,
      });
    });
  });
  it('should make a PR to a single fork of an upstream, but upstream / fork are null', () => {
    const upstream = generateRepo({
      owner: 'upstream', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
    });
    const fork = generateRepo({
      owner: 'fork', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
    });
    const gh = createMockGithubInstance([upstream, fork]);

    const link = {
      enabled: true,
      upstreamId: null,
      upstream: () => Promise.resolve(null),
      forkId: null,
      fork: () => Promise.resolve(null),
    };

    return webhook(gh, link, undefined, gh).then(output => {
      assert.deepEqual(output, {
        error: 'upstream-or-fork-false',
        isEnabled: true,
        msg: 'Please set both a "upstream" and "fork" on this link.',
      });
    });
  });
  it('should not run a disabled webhook', () => {
    const link = {
      enabled: false,
    };
    const gh = createMockGithubInstance([]);

    return webhook(gh, link, undefined, gh).then(output => {
      assert.deepEqual(output, {
        error: 'not-enabled',
        isEnabled: false,
      });
    });
  });
});
