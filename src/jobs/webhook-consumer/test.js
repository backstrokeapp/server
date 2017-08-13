import assert from 'assert';
import {processBatch} from './index';
import MockModel from '../../test-helpers/mock-model';
import sinon from 'sinon';

const LONG_TIME_AGO = '2017-08-10T10:54:53.450Z';

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
    return Promise.resolve(popped ? {data: popped.item, id: popped.id}: null);
  },
};

const MockWebhookStatusStore = {
  data: {},
  reset() {
    this.data = {};
  },
  set(id, data) {
    this.data[id] = data;
    return Promise.resolve(id);
  },
  get(id) {
    return Promise.resolve(this.data[id]);
  },
};

Link.methods.display = function() { return this; }

describe('webhook consumer job', function() {
  let user, link;
  beforeEach(async () => {
    MockWebhookQueue.reset();

    user = await User.create({username: 'ryan'});
    link = await Link.create({
      name: 'My Link',
      enabled: true,
      owner: user.id,
      lastSyncedAt: LONG_TIME_AGO,

      upstreamType: 'repo',
      upstreamOwner: 'foo',
      upstreamRepo: 'bar',
      upstreamIsFork: false,
      upstreamBranches: '["master"]',
      upstreamBranch: 'master',

      forkType: 'fork-all',
      forkOwner: undefined,
      forkRepo: undefined,
      forkBranches: undefined,
      forkBranch: undefined,
    });
  });

  it(`should process a webhook`, async function() {
    // First, add an item to the queue
    const enqueuedAs = await MockWebhookQueue.push({
      type: 'MANUAL',
      user,
      link: {...link, owner: user},
    });

    // Run the worker.
    await processBatch(MockWebhookQueue, MockWebhookStatusStore);
    const webhookStatus = await MockWebhookStatusStore.get(enqueuedAs)

    // Make sure i\that it set the correct status.
    assert.equal(webhookStatus.status, 'OK');
    assert.equal(typeof webhookStatus.startedAt, 'string');
    assert.equal(typeof webhookStatus.finishedAt, 'string');
    assert.equal(webhookStatus.output.toString(), '[object Object]');
  });
});
