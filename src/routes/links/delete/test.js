import del from './';

import sinon from 'sinon';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../../test-helpers/issue-request';
import MockModel from '../../../test-helpers/mock-model';

const User = new MockModel(),
      Link = new MockModel([], {owner: User});

Link.methods.display = function() { return this; }

describe('link delete', () => {
  let user, link;

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

  it('should delete a link for a user', () => {
    const removeOldWebhooksForLink = sinon.stub().resolves(true);
    return issueRequest(
      del, [Link, removeOldWebhooksForLink],
      '/:id', user, {
        method: 'DELETE',
        url: `/${link.id}`,
        json: true,
      }
    ).then(res => {
      assert.equal(res.statusCode, 200);
      return Link.findOne({where: {id: link.id}});
    }).then(link => {
      assert.equal(link, null); // Link no longer exists.
    });
  });
  it('should try to delete a link, but fail when the link id is invalid', () => {
    const removeOldWebhooksForLink = sinon.stub().resolves(true);
    return issueRequest(
      del, [Link, removeOldWebhooksForLink],
      '/:id', user, {
        method: 'DELETE',
        url: `/21t2413131314913491`, // Bogus link id
        json: true,
      }
    ).then(res => {
      assert.equal(res.body.error, 'No such link.');
    });
  });
});
