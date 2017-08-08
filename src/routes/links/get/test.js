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

  it('should get a link for a user', () => {
    // Grab the first model from the mock (.models is a mock-specific property)
    const linkModel = Link.models[0];

    return issueRequest(
      get, [Link],
      '/:id', user, {
        method: 'GET',
        url: `/${linkModel.id}`,
        json: true,
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.id, linkModel.id);
    });
  });
  it('should try to get a link but fail', () => {
    // Grab the first model from the mock (.models is a mock-specific property)
    const linkModel = Link.models[0];

    return issueRequest(
      get, [Link],
      '/:id', user, {
        method: 'GET',
        url: `/13527501385710357139f313`, // Bogus id
        json: true,
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, 'No such link.');
    });
  });
  it('should try to get a link but the link is not owned by the authed user', () => {
    // Grab the first model from the mock (.models is a mock-specific property)
    const linkModel = Link.models[0];

    return issueRequest(
      get, [Link],
      '/:id', null, {
        method: 'GET',
        url: `/13527501385710357139f313`, // Bogus id
        json: true,
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, 'No such link.');
    });
  });
});
