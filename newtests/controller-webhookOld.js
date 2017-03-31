import webhookOld from '../src/controllers/webhookOld';
import sinon from 'sinon';

import assert from 'assert';

import createMockGithubInstance, {
  generateId,
  generateOwner,
  generateRepo,
} from './helpers/createMockGithubInstance';

// Helper for mounting routes in an express app and querying them.
import issueRequest from './helpers/issueRequest';

// Helper for managing database instances
import db from './helpers/createDatabaseModelInstances';

describe('classic webhook route', () => {
  let userData;

  beforeEach(() => {
    return db.makeLink().then(user => {
      userData = user;
    });
  });

  afterEach(() => {
    return db.reset();
  });

  it('should work as a classic webhook on upstream', () => {
    const webhook = sinon.stub().resolves({
      isEnabled: true,
      many: false,
      forkCount: 1,
    });

    const repo = generateRepo({
      owner: 'foo', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [],
      forks: [fork],
    });

    const fork = generateRepo({
      owner: 'fork', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [],
    });

    const gh = createMockGithubInstance([repo, fork]);

    return issueRequest(
      webhookOld, [webhook, gh],
      '/', userData, {
        method: 'GET',
        url: '/',
        json: true,
        body: {
          repository: {
            name: 'my-app',
            owner: { login: 'foo' },
            fork: false,
            html_url: `http://github.com/foo/my-app`,
            default_branch: 'master',
          },
        },
      }
    ).then(res => {
      assert.deepEqual(res.body, {
        status: 'ok',
        output: {
          isEnabled: true,
          many: false,
          forkCount: 1,
        },
      });

      // Make sure the webhook was sent the correct information
      const repo = webhook.getCall(0).args[1];
      assert.equal(repo.name, "Classic Backstroke Webhook");
      assert.equal(repo.upstream().type, 'repo');
      assert.equal(repo.fork().type, 'fork-all');
    });
  });
  it('should work as a classic webhook on fork', () => {
    const webhook = sinon.stub().resolves({
      isEnabled: true,
      many: false,
      forkCount: 1,
    });

    const repo = generateRepo({
      owner: 'foo', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [],
      forks: [fork],
    });

    const fork = generateRepo({
      owner: 'fork', name: 'my-app',
      default_branch: 'master',
      branches: ['master'],
      issues: [],
      parent: repo,
      isFork: true,
    });

    const gh = createMockGithubInstance([repo, fork]);

    return issueRequest(
      webhookOld, [webhook, gh],
      '/', userData, {
        method: 'GET',
        url: '/',
        json: true,
        body: {
          repository: {
            name: 'my-app',
            owner: { login: 'fork' },
            fork: false,
            html_url: `http://github.com/foo/my-app`,
            default_branch: 'master',
          },
        },
      }
    ).then(res => {
      assert.deepEqual(res.body, {
        status: 'ok',
        output: {
          isEnabled: true,
          many: false,
          forkCount: 1,
        },
      });

      // Make sure the webhook was sent the correct information
      const repo = webhook.getCall(0).args[1];
      assert.equal(repo.name, "Classic Backstroke Webhook");
      assert.equal(repo.upstream().type, 'repo');
      assert.equal(repo.fork().type, 'repo');
    });
  });
});
