import enable from './';

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

describe('link enable', () => {
  let userData, linkData, linkDataNoOwn, upstreamData, forkData;

  before(function() {
    return Promise.all([
      User.create({username: 'ryan'}),
      User.create({username: 'bill'}),
      Repository.create({type: 'repo'}), // Upstream
      Repository.create({type: 'repo'}), // Fork
    ]).then(([user, user2, upstream, fork]) => {
      userData = user;
      upstreamData = upstream;
      forkData = fork;
      return Promise.all([
        Link.create({
          name: 'My Link',
          enabled: true,
          hookId: ['123456'],
          owner: user.id,
          upstream: upstream.id,
          fork: fork.id,
        }),
        Link.create({
          name: 'My non-owned Link',
          enabled: true,
          hookId: ['123456'],
          owner: user2.id,
          upstream: upstream.id,
          fork: fork.id,
        }),
      ]);
    }).then(([link, linkNoOwn]) => {
      linkData = link;
      linkDataNoOwn = linkNoOwn;
    });
  });

  it('should enable a link for a user', () => {
    const enabledState = !linkData.enabled;
    return issueRequest(
      enable, [Link],
      '/:linkId', userData, {
        method: 'PUT',
        url: `/${linkData.id}`,
        json: true,
        body: {
          enabled: enabledState,
        },
      }
    ).then(res => {
      assert.equal(res.statusCode, 200);
      return Link.findOne({where: {id: linkData.id}});
    }).then(link => {
      assert.equal(link.enabled, enabledState);
    })
  });
  it('should try to enable a link, but fail with a malformed body', () => {
    const enabledState = !linkData.enabled;
    return issueRequest(
      enable, [Link],
      '/:linkId', userData, {
        method: 'PUT',
        url: `/${linkData.id}`,
        json: true,
        body: {
          no: 'enabled',
          property: 'here',
        },
      }
    ).then(res => {
      assert.equal(res.body.error, `Enabled property not specified in the body.`);
    })
  });
  it('should try to enable a link, but should fail with a bad link id', () => {
    const enabledState = !linkData.enabled;
    return issueRequest(
      enable, [Link],
      '/:linkId', userData, {
        method: 'PUT',
        url: `/32542542y52451311341`, // Bogus link id
        json: true,
        body: {
          enabled: enabledState,
        },
      }
    ).then(res => {
      assert.equal(res.body.error, 'No link found with the given id that is owned by you.');
    })
  });
  it(`should try to enable a link, but should fail when the link isn't owned by the current user.`, () => {
    const enabledState = !linkData.enabled;
    return issueRequest(
      enable, [Link],
      '/:linkId', userData, {
        method: 'PUT',
        url: `/${linkDataNoOwn.id}`, // Bogus link id
        json: true,
        body: {
          enabled: enabledState,
        },
      }
    ).then(res => {
      assert.equal(res.body.error, 'No link found with the given id that is owned by you.');
    })
  });
});
