import assert from 'assert';
import sinon from 'sinon';
import {res, generateLink, generateRepo} from '../testHelpers';
import getRepoName from 'helpers/getRepoName';

import createTemporaryRepo, {generateEphemeralRepoName} from 'helpers/createTemporaryRepo';

describe('webhook (with ephemeralRepo: true)', function() {
  it('should create an ephemeral repo when the flag is set, and use that in the pr', function() {
    // Create a link
    let link1 = generateLink();
    link1.pushUsers = ["foo-user"];

    // Create a source repo
    let repo1 = generateRepo('repo');
    repo1.ephemeralRepo = true;
    let [userName, repoName] = getRepoName(repo1);

    // The ephemeral repo that will be "created"
    let ephemeralRepo = generateRepo('repo');
    let ephemeralRepoName = generateEphemeralRepoName(userName, repoName);
    ephemeralRepo.name = `backstroke-bot/${ephemeralRepoName}`;

    let inst = {
      reposGet: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: ephemeralRepoName,
      }).rejects({code: 422}), // no ephemeral repo
    };

    let backstrokeBotInstance = {
      reposFork: sinon.mock().withArgs({
        user: userName,
        repo: repoName,
      }).resolves({
        owner: {
          login: 'backstroke-bot',
        },
        name: repoName,
        private: false,
      }),

      reposEdit: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: repoName,
        name: ephemeralRepoName,
        description: `A temporary backstroke repo to fix merge conflicts.`,
        homepage: `http://github.com/${userName}/${repoName}`,
        private: false,
        has_issues: false,
        has_wiki: false,
        has_downloads: false,
        auto_init: false,
      }).resolves({
        owner: {login: 'backstroke-bot'},
        name: ephemeralRepoName,
        private: false,
      }),

      reposAddCollaborator: sinon.mock().withArgs({
        user: 'backstroke-bot', repo: ephemeralRepoName,
        collabuser: 'foo-user',
        permission: 'push',
      }),
    };

    return createTemporaryRepo(inst, backstrokeBotInstance, link1, repo1).then(repo => {
      inst.reposGet.verify();
      backstrokeBotInstance.reposFork.verify();
      backstrokeBotInstance.reposEdit.verify();
      backstrokeBotInstance.reposAddCollaborator.verify();

      assert.deepEqual(repo, {
        type: 'repo',
        name: `backstroke-bot/${ephemeralRepoName}`,
        private: false,
        provider: 'github',
        fork: true,
        branch: repo1.branch,
      });
    })
  });
  it('should try to merge changes when the ephemeral repo already exists', function() {
    // Create a link
    let link1 = generateLink();
    link1.pushUsers = ["foo-user"];

    // Create a source repo
    let repo1 = generateRepo('repo');
    repo1.ephemeralRepo = true;
    let [userName, repoName] = getRepoName(repo1);

    // The ephemeral repo that "already exists"
    let ephemeralRepo = generateRepo('repo');
    let [ephemeralUserName] = getRepoName(ephemeralRepo);
    let ephemeralRepoName = generateEphemeralRepoName(userName, repoName);
    ephemeralRepo.name = `backstroke-bot/${ephemeralRepoName}`;

    // Methods that are called with the regular authed user
    let inst = {
      reposGet: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: ephemeralRepoName,
      }).resolves(true), // the repo exists
    };

    // Methods that are called with the `backstroke-bot` user
    let prNumber = Math.floor(Math.random() * 1000);
    let backstrokeBotInstance = {
      pullRequestsCreate: sinon.mock().withArgs({
        user: 'backstroke-bot', repo: ephemeralRepoName,
        title: 'Merge in new changes from the upstream into this ephemeral snapshot',
        head: `${userName}:${repo1.branch}`,
        base: ephemeralRepo.branch,
      }).resolves({number: prNumber}),
      pullRequestsMerge: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: ephemeralRepoName,
        number: prNumber,
      }),
    };

    return createTemporaryRepo(inst, backstrokeBotInstance, link1, repo1).then(repo => {
      inst.reposGet.verify();
      backstrokeBotInstance.pullRequestsCreate.verify();
      backstrokeBotInstance.pullRequestsMerge.verify();

      assert.deepEqual(repo, {
        type: 'repo',
        name: `backstroke-bot/${ephemeralRepoName}`,
        private: false,
        provider: 'github',
        fork: true,
        branch: repo1.branch,
      });
    })
  });
  it('should throw when ephemeral repo cannot be forked from the child', function() {
    // Create a link
    let link1 = generateLink();
    link1.pushUsers = ["foo-user"];

    // Create a source repo
    let repo1 = generateRepo('repo');
    repo1.ephemeralRepo = true;
    let [userName, repoName] = getRepoName(repo1);

    // The ephemeral repo that will be "created"
    let ephemeralRepo = generateRepo('repo');
    let ephemeralRepoName = generateEphemeralRepoName(userName, repoName);
    ephemeralRepo.name = `backstroke-bot/${ephemeralRepoName}`;

    let inst = {
      reposGet: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: ephemeralRepoName,
      }).rejects({code: 422}), // no ephemeral repo
    };

    let backstrokeBotInstance = {
      reposFork: sinon.mock().withArgs({
        user: userName,
        repo: repoName,
      }).resolves(false), // fork didn't work right
    };

    return createTemporaryRepo(inst, backstrokeBotInstance, link1, repo1).catch(err => {
      inst.reposGet.verify();
      backstrokeBotInstance.reposFork.verify();
      assert(err instanceof Error);
      assert.deepEqual(err.message, 'Cannot create the ephemeral repo: fork failed.');
    });
  });
  it('should fail gracefully on error when the ephemeral repo is being fetched', function() {
    // Create a link
    let link1 = generateLink();
    link1.pushUsers = ["foo-user"];

    // Create a source repo
    let repo1 = generateRepo('repo');
    repo1.ephemeralRepo = true;
    let [userName, repoName] = getRepoName(repo1);

    // The ephemeral repo that "already exists"
    let ephemeralRepo = generateRepo('repo');
    let [ephemeralUserName] = getRepoName(ephemeralRepo);
    let ephemeralRepoName = generateEphemeralRepoName(userName, repoName);
    ephemeralRepo.name = `backstroke-bot/${ephemeralRepoName}`;

    // Methods that are called with the regular authed user
    let inst = {
      reposGet: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: ephemeralRepoName,
      }).rejects(new Error('explosion')),
    };

    // Methods that are called with the `backstroke-bot` user
    let prNumber = Math.floor(Math.random() * 1000);
    let backstrokeBotInstance = {
      pullRequestsCreate: sinon.mock().withArgs({
        user: 'backstroke-bot', repo: ephemeralRepoName,
        title: 'Merge in new changes from the upstream into this ephemeral snapshot',
        head: `${userName}:${repo1.branch}`,
        base: ephemeralRepo.branch,
      }).resolves({number: prNumber}),
      pullRequestsMerge: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: ephemeralRepoName,
        number: prNumber,
      }),
    };

    return createTemporaryRepo(inst, backstrokeBotInstance, link1, repo1).catch(err => {
      inst.reposGet.verify();
      assert(err instanceof Error);
      assert.deepEqual(err.message, 'explosion');
    });
  });
  it('should fail gracefully on error when the ephemeral repo is being updated', function() {
    // Create a link
    let link1 = generateLink();
    link1.pushUsers = ["foo-user"];

    // Create a source repo
    let repo1 = generateRepo('repo');
    repo1.ephemeralRepo = true;
    let [userName, repoName] = getRepoName(repo1);

    // The ephemeral repo that "already exists"
    let ephemeralRepo = generateRepo('repo');
    let [ephemeralUserName] = getRepoName(ephemeralRepo);
    let ephemeralRepoName = generateEphemeralRepoName(userName, repoName);
    ephemeralRepo.name = `backstroke-bot/${ephemeralRepoName}`;

    // Methods that are called with the regular authed user
    let inst = {
      reposGet: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: ephemeralRepoName,
      }).resolves(true),
    };

    // Methods that are called with the `backstroke-bot` user
    let prNumber = Math.floor(Math.random() * 1000);
    let backstrokeBotInstance = {
      pullRequestsCreate: sinon.mock().withArgs({
        user: 'backstroke-bot', repo: ephemeralRepoName,
        title: 'Merge in new changes from the upstream into this ephemeral snapshot',
        head: `${userName}:${repo1.branch}`,
        base: ephemeralRepo.branch,
      }).rejects(new Error('explosion')),
      pullRequestsMerge: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: ephemeralRepoName,
        number: prNumber,
      }),
    };

    return createTemporaryRepo(inst, backstrokeBotInstance, link1, repo1).catch(err => {
      inst.reposGet.verify();
      backstrokeBotInstance.pullRequestsCreate.verify();
      assert(err instanceof Error);
      assert.deepEqual(err.message, 'explosion');
    });
  });
  it('should fail gracefully on error when the ephemeral repo\'s updates are being merged', function() {
    // Create a link
    let link1 = generateLink();
    link1.pushUsers = ["foo-user"];

    // Create a source repo
    let repo1 = generateRepo('repo');
    repo1.ephemeralRepo = true;
    let [userName, repoName] = getRepoName(repo1);

    // The ephemeral repo that "already exists"
    let ephemeralRepo = generateRepo('repo');
    let [ephemeralUserName] = getRepoName(ephemeralRepo);
    let ephemeralRepoName = generateEphemeralRepoName(userName, repoName);
    ephemeralRepo.name = `backstroke-bot/${ephemeralRepoName}`;

    // Methods that are called with the regular authed user
    let inst = {
      reposGet: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: ephemeralRepoName,
      }).resolves(true),
    };

    // Methods that are called with the `backstroke-bot` user
    let prNumber = Math.floor(Math.random() * 1000);
    let backstrokeBotInstance = {
      pullRequestsCreate: sinon.mock().withArgs({
        user: 'backstroke-bot', repo: ephemeralRepoName,
        title: 'Merge in new changes from the upstream into this ephemeral snapshot',
        head: `${userName}:${repo1.branch}`,
        base: ephemeralRepo.branch,
      }).resolves({number: prNumber}),
      pullRequestsMerge: sinon.mock().withArgs({
        user: 'backstroke-bot',
        repo: ephemeralRepoName,
        number: prNumber,
      }).rejects(new Error('explosion')),
    };

    return createTemporaryRepo(inst, backstrokeBotInstance, link1, repo1).catch(err => {
      inst.reposGet.verify();
      backstrokeBotInstance.pullRequestsCreate.verify();
      backstrokeBotInstance.pullRequestsMerge.verify();
      assert(err instanceof Error);
      assert.deepEqual(err.message, 'explosion');
    });
  });
});
