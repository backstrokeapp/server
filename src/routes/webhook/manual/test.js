import webhook from './index';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../../test-helpers/issue-request';
import MockModel from '../../../test-helpers/mock-model';

const User = new MockModel(),
      Link = new MockModel([], {owner: User});

const MockWebhookQueue = {
  queue: [],
  reset() {
    this.queue = [];
  },
  push(item) {
    const id = (new Date()).getTime();
    this.queue.push({id, item});
    return Promise.resolve(id);
  },
  pop() {
    const popped = this.queue.pop();
    return Promise.resolve(popped ? popped.item : null);
  },
};

describe('webhook tests', function() {
  let user, link, disabledLink;

  beforeEach(async function() {
    MockWebhookQueue.reset();

    user = await User.create({username: 'ryan'});
    link = await Link.create({
      name: 'My Link',
      enabled: true,
      owner: user.id,
      webhookId: '123',

      upstreamType: 'repo',
      upstreamOwner: 'foo',
      upstreamRepo: 'bar',
      upstreamIsFork: false,
      upstreamBranches: '["master"]',
      upstreamBranch: 'master',

      forkType: 'all-forks',
      forkOwner: undefined,
      forkRepo: undefined,
      forkBranches: undefined,
      forkBranch: undefined,
    });
    disabledLink = await Link.create({
      name: 'My Link',
      enabled: false,
      owner: user.id,
      webhookId: '456',

      upstreamType: 'repo',
      upstreamOwner: 'foo',
      upstreamRepo: 'bar',
      upstreamIsFork: false,
      upstreamBranches: '["master"]',
      upstreamBranch: 'master',

      forkType: 'all-forks',
      forkOwner: undefined,
      forkRepo: undefined,
      forkBranches: undefined,
      forkBranch: undefined,
    });
  });

  it('should add to the queue', function() {
    return issueRequest(
      webhook, [Link, User, MockWebhookQueue],
      '/_:linkId', null, {
        method: 'POST',
        url: `/_${link.webhookId}`,
        json: true,
      }
    ).then(res => {
      // Assert an item has been put into the queue.
      assert.equal(MockWebhookQueue.queue.length, 1);

      // And that the response was correct.
      const enqueuedAs = MockWebhookQueue.queue[0].id;
      assert.equal(res.statusCode, 201);
      assert.deepEqual(res.body, {
        message: 'Scheduled webhook.',
        enqueuedAs,
        statusUrl: `http://localhost:8000/v1/operations/${enqueuedAs}`,
      });
    });
  });
  it('should not add to the queue when a link is disabled', function() {
    return issueRequest(
      webhook, [Link, User, MockWebhookQueue],
      '/_:linkId', null, {
        method: 'POST',
        url: `/_${disabledLink.webhookId}`,
        json: true,
      }
    ).then(res => {
      // Assert an item has not been put into the queue.
      assert.equal(MockWebhookQueue.queue.length, 0);

      // And that the response was correct.
      assert.equal(res.body.error, 'Link is not enabled!');
    });
  });
  it('should not add to the queue when a link does not exist', function() {
    return issueRequest(
      webhook, [Link, User, MockWebhookQueue],
      '/_:linkId', null, {
        method: 'POST',
        url: `/_bogusid`,
        json: true,
      }
    ).then(res => {
      // Assert an item has not been put into the queue.
      assert.equal(MockWebhookQueue.queue.length, 0);

      // And that the response was correct.
      assert.equal(res.body.error, 'No such link with the id bogusid');
    });
  });
});
