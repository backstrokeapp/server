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
      default_branch: 'master',
      branches: ['master'],
      issues: [],
    });
    const upstream = generateRepo({
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
      upstreamId: 1,
      upstream: () => Promise.resolve({
        type: 'repo',
        owner: upstream.owner.login,
        repo: upstream.name,
        branch: 'master',
      }),
      forkId: 1,
      fork: () => Promise.resolve({type: 'fork-all'}),
    };

    return webhook(gh, link, undefined, gh).then(optout => {
      assert.deepEqual(optout, {
        status: 'ok',
        many: true,
        forkCount: 1,
        isEnabled: true,
      });
    });
  });
  it('should make a PR to a single fork of an upstream', () => {
    const upstream = generateRepo({
      default_branch: 'master',
      branches: ['master'],
      issues: [],
    });
    const fork = generateRepo({
      default_branch: 'master',
      branches: ['master'],
      issues: [],
    });
    const gh = createMockGithubInstance([upstream, fork]);

    const upstreamId = generateId(),
          forkId = generateId();
    const link = {
      enabled: true,
      upstreamId: 1,
      upstream: () => Promise.resolve({
        type: 'repo',
        owner: upstream.owner.login,
        repo: upstream.name,
        branch: 'master',
      }),
      forkId: 1,
      fork: () => Promise.resolve({
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
});
