import del from './';

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

describe('link delete', () => {
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

  it('should delete a link for a user', () => {
    const removeOldWebhooksForLink = sinon.stub().resolves(true);
    return issueRequest(
      del, [Link, removeOldWebhooksForLink],
      '/:id', userData, {
        method: 'DELETE',
        url: `/${linkData.id}`,
        json: true,
      }
    ).then(res => {
      assert.equal(res.statusCode, 200);
      return Link.findOne({where: {id: linkData.id}});
    }).then(link => {
      assert.equal(link, null); // Link no longer exists.
    });
  });
  it('should try to delete a link, but fail when the link id is invalid', () => {
    const removeOldWebhooksForLink = sinon.stub().resolves(true);
    return issueRequest(
      del, [Link, removeOldWebhooksForLink],
      '/:id', userData, {
        method: 'DELETE',
        url: `/21t2413131314913491`, // Bogus link id
        json: true,
      }
    ).then(res => {
      assert.equal(res.body.error, 'No such link.');
    });
  });
});
