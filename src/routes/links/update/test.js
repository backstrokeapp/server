import update from './';

import sinon from 'sinon';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../../test-helpers/issue-request';
import MockModel from '../../../test-helpers/mock-model';

const isCollaboratorOfRepository = () => Promise.resolve(true);

const User = new MockModel(),
      Link = new MockModel([], {owner: User});

Link.methods.display = function() { return this; }

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

      forkType: 'fork-all',
      forkOwner: undefined,
      forkRepo: undefined,
      forkBranches: undefined,
      forkBranch: undefined,
    });
  });

  it('should update a link for a user', () => {
    return issueRequest(
      update, [Link, isCollaboratorOfRepository],
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
            branches: ['master'],
            branch: 'master',
          },
          fork: {
            type: 'fork-all'
          },
        },
      },
    ).then(res => {
      const body = res.body;
      assert.equal(body.name, 'Another name for my link!');

      return Link.findById(link.id);
    }).then(link => {
      assert.equal(link.name, 'Another name for my link!');
    });
  });
  it(`should update a link for a user but the user doesn't own the link`, () => {
    return issueRequest(
      update, [Link, isCollaboratorOfRepository],
      '/:linkId', {id: 'bogus'} /* bogus user */, {
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
            branches: ['master'],
            branch: 'master',
          },
          fork: {
            type: 'fork-all',
          },
        },
      },
    ).then(res => {
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'No such link found that is owned by this account.');

      return Link.findById(link.id);
    }).then(link => {
      assert.equal(link.name, 'My Link');
    });
  });
  it('should update a link with a new upstream', () => {
    // First, remove the upstream id from the link to test against.
    return issueRequest(
      update, [Link, isCollaboratorOfRepository],
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
    ).then(res => {
      const body = res.body;
      assert.equal(body.id, link.id);
      assert.equal(body.name, 'Another name for my link!');

      return Link.findById(link.id);
    }).then(link => {
      assert.equal(link.name, 'Another name for my link!');
    });
  });
  it(`should try to update a link with a bad id.`, () => {
    // First, remove the upstream id from the link to test against.
    return issueRequest(
      update, [Link, isCollaboratorOfRepository],
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
      assert.equal(body.error, `No such link found that is owned by this account.`);
    });
  });
  it(`should try to update a link with a malformed body`, () => {
    // First, remove the upstream id from the link to test against.
    return issueRequest(
      update, [Link, isCollaboratorOfRepository],
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
      update, [Link, isCollaboratorOfRepository],
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
      update, [Link, isCollaboratorOfRepository],
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
      update, [Link, isCollaboratorOfRepository],
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
  it(`should try to update a link (the link syncs to all forks), but the user isn't a collaborator on the upstream`, () => {
    return issueRequest(
      update, [Link, () => Promise.resolve(false)],
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
            branches: ['master'],
            branch: 'master',
          },
          fork: {
            type: 'fork-all',
          },
        },
      },
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, `To update a link that syncs changes from the upstream foo/bar to all fork, you need to be a collaborator on foo/bar. Instead, sync to a single fork that you own instead of all forks.`);
    });
  });
  it(`should try to update a link (the link syncs to a single fork), but the user isn't a collaborator on the fork`, () => {
    return issueRequest(
      update, [Link, () => Promise.resolve(false)],
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
            branches: ['master'],
            branch: 'master',
          },
          fork: {
            type: 'repo',
            owner: 'hello',
            repo: 'world',
            isFork: false,
            branches: ['master'],
            branch: 'master',
          },
        },
      },
    ).then(res => {
      const body = res.body;
      assert.equal(body.error, `You need to be a collaborator of hello/world to sync changes to that fork.`);
    });
  });
});
