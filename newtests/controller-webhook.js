import webhookRoute from '../src/controllers/webhook';
import sinon from 'sinon';

import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
import issueRequest from './helpers/issueRequest';

// Helper for managing database instances
import db from './helpers/createDatabaseModelInstances';

describe('webhook route', () => {
  let userData, linkData;

  before(function() {
    this.timeout(5000);
    return db.makeUser().then(owner => {
      userData = owner;
      return db.makeLink({
        owner: owner.id,
        enabled: true,
        upstream: {
          type: 'repo',
          owner: 'foo',
          repo: 'bar',
          branch: 'master',
        },
        fork: {
          type: 'fork-all',
        },
      });
    }).then(link => {
      linkData = link;
    });
  });

  after(() => {
    return db.reset();
  });

  it('should work', () => {
    const webhook = sinon.stub().resolves({
      isEnabled: true,
      many: false,
      forkCount: 1,
    });

    return issueRequest(
      webhookRoute, [db.Link, webhook],
      '/:linkId', userData, {
        method: 'GET',
        url: `/${linkData.id}`,
        json: true,
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
      assert.deepEqual(webhook.getCall(0).args[1].id, linkData.id);
    });
  });
});
