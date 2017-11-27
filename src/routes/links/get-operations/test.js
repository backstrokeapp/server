import get from './';

import sinon from 'sinon';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../../test-helpers/issue-request';
import MockModel from '../../../test-helpers/mock-model';

const User = new MockModel(),
      Link = new MockModel([], {owner: User});

Link.methods.display = function() { return this; }

describe('link get', () => {
  let user, link, link2;

  beforeEach(async function() {
    user = await User.create({username: 'ryan'});
    link = await Link.create({
      name: 'My Link',
      enabled: true,
      owner: user.id,

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

  it('should fetch all operations for a link in the past 24 hours', () => {
    // Grab the most recent model from the mock (.models is a mock-specific property)
    const linkModel = Link.models[Link.models.length - 1];

    // Create a mock status store to use with this test.
    const MockWebhookStatusStore = {
      getOperations: sinon.stub().resolves(['adgrha', 'uyrjnh', 'brsnyi']),
      get: sinon.stub().resolves({status: 'ok'}),
    };

    return issueRequest(
      get, [Link, MockWebhookStatusStore],
      '/operations/:id', user, {
        method: 'GET',
        url: `/operations/${linkModel.id}`,
        json: true,
      }
    ).then(res => {
      const body = res.body;
      assert.deepEqual(body, ['adgrha', 'uyrjnh', 'brsnyi']);

      // Assert that `.get` wasn't called.
      assert.equal(MockWebhookStatusStore.getOperations.callCount, 1);
      assert.equal(MockWebhookStatusStore.get.callCount, 0);
    });
  });
  it('should try to fetch all operations for a link, but fail if the link id is bad', () => {
    // Create a mock status store to use with this test.
    const MockWebhookStatusStore = {
      getOperations: sinon.stub().resolves(['adgrha', 'uyrjnh', 'brsnyi']),
      get: sinon.stub().resolves({status: 'ok'}),
    };

    return issueRequest(
      get, [Link, MockWebhookStatusStore],
      '/:id', user, {
        method: 'GET',
        url: `/13527501385710357139f313`, // Bogus id
        json: true,
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, 'No such link.');

      // Assert that both functions weren't called.
      assert.equal(MockWebhookStatusStore.getOperations.callCount, 0);
      assert.equal(MockWebhookStatusStore.get.callCount, 0);
    });
  });
  it('should try to fetch all operations for a link, but fail when the redis call fails', () => {
    // Grab the most recent model from the mock (.models is a mock-specific property)
    const linkModel = Link.models[Link.models.length - 1];

    // Create a mock status store to use with this test.
    const MockWebhookStatusStore = {
      getOperations: sinon.stub().rejects(new Error('Boom!')),
      get: sinon.stub().resolves({status: 'ok'}),
    };

    return issueRequest(
      get, [Link, MockWebhookStatusStore],
      '/operations/:id', user, {
        method: 'GET',
        url: `/operations/${linkModel.id}`,
        json: true,
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, 'Boom!');

      // Assert that `.get` wasn't called.
      assert.equal(MockWebhookStatusStore.getOperations.callCount, 1);
      assert.equal(MockWebhookStatusStore.get.callCount, 0);
    });
  });
  it('should fetch all operations for a link in the past 24 hours, with ?detail=true param', () => {
    // Grab the most recent model from the mock (.models is a mock-specific property)
    const linkModel = Link.models[Link.models.length - 1];

    // Create a mock status store to use with this test.
    const MockWebhookStatusStore = {
      getOperations: sinon.stub().resolves(['adgrha', 'uyrjnh', 'brsnyi']),
      get: sinon.stub().resolves({status: 'OK'}),
    };

    return issueRequest(
      get, [Link, MockWebhookStatusStore],
      '/operations/:id', user, {
        method: 'GET',
        url: `/operations/${linkModel.id}?detail=true`,
        json: true,
      }
    ).then(res => {
      const body = res.body;
      assert.deepEqual(body, [
        {id: 'adgrha', status: 'OK'},
        {id: 'uyrjnh', status: 'OK'},
        {id: 'brsnyi', status: 'OK'},
      ]);

      // Assert that `.getOperations` was called once and `.get` was called three times.
      assert.equal(MockWebhookStatusStore.getOperations.callCount, 1);
      assert.equal(MockWebhookStatusStore.get.callCount, 3);
    });
  });
  it('should try to fetch all operations for a link with ?detail=true param, but fail when the redis call fails', () => {
    // Grab the most recent model from the mock (.models is a mock-specific property)
    const linkModel = Link.models[Link.models.length - 1];

    // Create a mock status store to use with this test.
    const MockWebhookStatusStore = {
      getOperations: sinon.stub().resolves(['adgrha', 'uyrjnh', 'brsnyi']),
      get: sinon.stub().rejects(new Error('Boom!')),
    };

    return issueRequest(
      get, [Link, MockWebhookStatusStore],
      '/operations/:id', user, {
        method: 'GET',
        url: `/operations/${linkModel.id}?detail=TRUE`,
        json: true,
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, 'Boom!');

      assert.equal(MockWebhookStatusStore.getOperations.callCount, 1);
      assert.equal(MockWebhookStatusStore.get.callCount, 3);
    });
  });
});
