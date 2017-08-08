import update from './';

import sinon from 'sinon';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../../test-helpers/issue-request';
import MockModel from '../../../test-helpers/mock-model';

const User = new MockModel(),
      Link = new MockModel([], {owner: User});

Link.methods.display = function() { return this; }
Link.methods.update = sinon.stub().callsFake(function() { return Promise.resolve(this); });

describe('link update', () => {
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

  it('should update a link for a user', () => {
    return issueRequest(
      update, [Link],
      '/:linkId', user, {
        method: 'PUT',
        url: `/${link.id}`,
        json: true,
        body: {
          name: 'Another name for my link!',
          upstream: {
            type: 'repo',
            owner: 'foo',
            repo: 'bar',
            isFork: false,
            branches: '["master"]',
            branch: 'master',
          },
          fork: {
            type: 'all-forks'
          },
        },
      },
    ).then(res => {
      const body = res.body;
      assert.equal(body.name, 'Another name for my link!');

      return Link.find(link.id);
    }).then(link => {
      assert.equal(link.name, 'Another name for my link!');
    });
  });
  it('should update a link with a new upstream', () => {
    const addWebhooksForLink = sinon.stub().resolves(['98765']);
    const removeOldWebhooksForLink = sinon.stub().resolves();

    // First, remove the upstream id from the link to test against.
    return link.updateAttribute('upstreamId', null).then(() => {
      return issueRequest(
        update, [Link],
        '/:linkId', user, {
          method: 'PUT',
          url: `/${link.id}`,
          json: true,
          body: {
            name: 'Another name for my link!',
            upstream: {
              type: 'repo',
              owner: 'foo',
              repo: 'bar',
              branches: ['master'],
              branch: 'master',
            },
            fork: {
              type: 'fork-all',
            },
          },
        }
      );
    }).then(res => {
      const body = res.body;
      assert.equal(body.id, link.id);
      assert.equal(body.name, 'Another name for my link!');

      return Link.find(link.id);
    }).then(link => {
      assert.equal(link.name, 'Another name for my link!');
    });
  });
  it(`should try to update a link with a bad id.`, () => {
    // First, remove the upstream id from the link to test against.
    return issueRequest(
      update, [Link],
      '/:linkId', user, {
        method: 'PUT',
        url: `/BOGUS-ID-HERE`,
        json: true,
        body: {
          name: 'Another name for my link!',
          upstream: {
            type: 'repo',
            owner: 'foo',
            repo: 'bar',
            branches: ['master'],
            branch: 'master',
          },
          fork: {
            type: 'fork-all',
          },
        },
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, `No such link with that id.`);
    });
  });
  it(`should try to update a link with a malformed body`, () => {
    // First, remove the upstream id from the link to test against.
    return issueRequest(
      update, [Link],
      '/:linkId', user, {
        method: 'PUT',
        url: `/${link.id}`,
        json: true,
        body: [],
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, `Invalid json body.`);
    });
  });
  it(`should try to update a link with a valid body but no upstream`, () => {
    // First, remove the upstream id from the link to test against.
    return issueRequest(
      update, [Link],
      '/:linkId', user, {
        method: 'PUT',
        url: `/${link.id}`,
        json: true,
        body: {
          name: 'Another name for my link!',
          /* NO UPSTREAM */
          fork: {
            type: 'fork-all',
          },
        },
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, `Link doesn't have an 'upstream' key.`);
    });
  });
  it(`should try to update a link with a valid body but no fork`, () => {
    // First, remove the upstream id from the link to test against.
    return issueRequest(
      update, [Link],
      '/:linkId', user, {
        method: 'PUT',
        url: `/${link.id}`,
        json: true,
        body: {
          name: 'Another name for my link!',
          upstream: {
            type: 'repo',
            owner: 'foo',
            repo: 'bar',
            branches: ['master'],
            branch: 'master',
          },
          /* NO FORK */
        },
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, `Link doesn't have a 'fork' key.`);
    });
  });
  it(`should try to update a link with a valid body but an upstream that isn't a repo`, () => {
    // First, remove the upstream id from the link to test against.
    return issueRequest(
      update, [Link],
      '/:linkId', user, {
        method: 'PUT',
        url: `/${link.id}`,
        json: true,
        body: {
          name: 'Another name for my link!',
          upstream: {
            type: 'fork-all', // <= An upstream must be a repo, so this should fail.
          },
          fork: {
            type: 'fork-all',
          },
        },
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, `The 'upstream' repo must be a repo, not a bunch of forks.`);
    });
  });
});
