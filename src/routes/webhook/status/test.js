import status from './index';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../../test-helpers/issue-request';

const MockWebhookStatusStore = {
  keys: {},
  set(webhookId, status) {
    const id = (new Date()).getTime();
    this.keys[webhookId] = {status, id};
    return Promise.resolve(id);
  },
  get(webhookId) {
    return Promise.resolve(this.keys[webhookId] ? this.keys[webhookId].status : null);
  },
};

// Example payloads to use in tests.
const exampleOperationId = 'esr9z0fugfmYKy0T2RIignKv8wf6irk0';
const exampleOperationPayload = {
  status: 'RUNNING',
  startedAt: '2017-08-17T11:46:34.901Z',
};

describe('webhook status', function() {
  beforeEach(async function() {
    // Reset the status store.
    MockWebhookStatusStore.keys = {};
  });

  it('should pull a webhook operation status from the status store', async function() {
    // Set the operation payload.
    await MockWebhookStatusStore.set(exampleOperationId, exampleOperationPayload);

    return issueRequest(
      status, [MockWebhookStatusStore],
      '/:operationId', null, {
        method: 'POST',
        url: `/${exampleOperationId}`,
        json: true,
      }
    ).then(res => {
      // Assert that the response was correct.
      assert.deepEqual(res.body, exampleOperationPayload);
    });
  });
  it(`should not pull a webhook operation status from the status store if the operation doesn't exist`, async function() {
    // Set the operation payload.
    await MockWebhookStatusStore.set(exampleOperationId, exampleOperationPayload);

    return issueRequest(
      status, [MockWebhookStatusStore],
      '/:operationId', null, {
        method: 'POST',
        url: `/bogusid`,
        json: true,
      }
    ).then(res => {
      // Assert that the response was correct.
      assert.equal(res.body.error, 'No such webhook operation was found with that id.');
    });
  });
});
