import get from './';

import sinon from 'sinon';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../../test-helpers/issue-request';
import MockModel from '../../../test-helpers/mock-model';

const User = new MockModel(),
      Repository = new MockModel(),
      Link = new MockModel([], {upstream: Repository, owner: User, fork: Repository});

Link.methods.display = function() { return this; }

describe('link get', () => {
  let userData, linkData, upstreamData, forkData;

  beforeEach(function() {
    return Promise.all([
      User.create({username: 'ryan'}),
      Repository.create({type: 'repo'}), // Upstream
      Repository.create({type: 'repo'}), // Fork
    ]).then(([user, upstream, fork]) => {
      userData = user;
      upstreamData = upstream;
      forkData = fork;
      return Link.create({
        name: 'My Link',
        enabled: true,
        hookId: ['123456'],
        owner: user.id,
        upstream: upstream.id,
        fork: fork.id,
      });
    }).then(link => {
      linkData = link;
    });
  });

  it('should get a link for a user', () => {
    // Grab the first model from the mock (.models is a mock-specific property)
    const linkModel = Link.models[0];

    return issueRequest(
      get, [Link],
      '/:id', userData, {
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
      '/:id', userData, {
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
