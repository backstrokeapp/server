import create from './';

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

describe('link create', () => {
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

  it('should create a link for a user', () => {
    return issueRequest(
      create, [Link],
      '/', userData, {
        method: 'POST',
        url: '/',
        json: true,
      }
    ).then(res => {
      const body = res.body;
      assert.notEqual(body.id, linkData.id); // Make sure the id is something else.
      return Link.findOne({where: {id: body.id}});
    }).then(link => {
      assert.equal(link.enabled, false);
    });
  });
});
