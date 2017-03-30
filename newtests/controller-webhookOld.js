import webhookOld from '../src/controllers/webhookOld';
import sinon from 'sinon';

import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
import issueRequest from './helpers/issueRequest';

// Helper for managing database instances
import Database from './helpers/createDatabaseModelInstances';

describe('classic webhook route', () => {
  let db, userData;

  beforeEach(() => {
    db = new Database();
    return db.makeLink().then(user => {
      userData = user;
    });
  });

  afterEach(() => {
    db = null;
  });

  it('should work as a classic webhook on upstream', () => {
    const webhook = sinon.stub().resolves({
      isEnabled: true,
      many: false,
      forkCount: 1,
    });

    return issueRequest(
      webhookOld, [webhook],
      '/', userData, {
        method: 'GET',
        url: '/',
        json: true,
        body: {
          repository: {
            name: 'foo',
            owner: { name: 'bar' },
            fork: false,
            html_url: `http://github.com/foo/bar`,
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
      assert.deepEqual(webhook.getCall(0).args[1], {
        name: 'Classic Backstroke Webhook',
        enabled: true,
        hookId: null,
        owner: null,
        allForks: true,
        upstream: {
          type: 'repo',
          owner: 'foo',
          repo: 'bar',
          fork: false,
          html_url: 'http://github.com/foo/bar',
          branches: ['master'],
          branch: 'master',
        },
        fork: {
          type: 'fork-all',
        },
      });
    });
  });
});
