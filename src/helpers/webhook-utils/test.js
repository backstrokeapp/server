import assert from 'assert';
import sinon from 'sinon';
import {
  addWebhooksForLink, NO_PERMISSION, ALREADY_EXISTS,
  removeOldWebhooksForLink,
} from './';

import MockModel from '../../test-helpers/mock-model';
const User = new MockModel(),
      Repository = new MockModel(),
      Link = new MockModel([], {upstream: Repository, owner: User, fork: Repository});

describe('add webhooks for links', function() {
  it('should do nothing when a webhook already exists on at least one repo', async () => {
    const reposCreateHook = sinon.stub();
      reposCreateHook.onFirstCall().resolves(NO_PERMISSION);
      reposCreateHook.onSecondCall().resolves(ALREADY_EXISTS);

    const owner = {username: 'ryan'};
    const upstream = {type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'};
    const fork = {type: 'repo', owner: 'hello', repo: 'world', branch: 'master'};

    const link = {
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner,
      upstream,
      fork,
    };

    return addWebhooksForLink({
      github: {
        user: {
          reposCreateHook,
        },
      },
    }, link).then(resp => {
      // Successful, and no new webhooks were created.
      assert.equal(resp.length, 0);
    })
  });
  it('should try to create a webhook on at least one repo', async () => {
    const reposCreateHook = sinon.stub();
      reposCreateHook.onFirstCall().resolves({id: 3}); // Created webhook
      reposCreateHook.onSecondCall().resolves(NO_PERMISSION);

    const owner = {username: 'ryan'};
    const upstream = {type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'};
    const fork = {type: 'repo', owner: 'hello', repo: 'world', branch: 'master'};

    const link = {
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner,
      upstream,
      fork,
    };

    return addWebhooksForLink({
      github: {
        user: {
          reposCreateHook,
        },
      },
    }, link).then(resp => {
      // Successful, and no new webhooks were created.
      assert.equal(resp.length, 1);
    })
  });
  it('should error if a webhook cannot be created on either repo', async () => {
    const reposCreateHook = sinon.stub();
      reposCreateHook.onFirstCall().resolves(NO_PERMISSION);
      reposCreateHook.onSecondCall().resolves(NO_PERMISSION);

    const owner = {username: 'ryan'};
    const upstream = {type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'};
    const fork = {type: 'repo', owner: 'hello', repo: 'world', branch: 'master'};

    const link = {
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner,
      upstream,
      fork,
    };

    return addWebhooksForLink({
      github: {
        user: {
          reposCreateHook,
        },
      },
    }, link).then(() => {
      // Shoudn't be successful
      assert(false);
    }).catch(err => {
      // Successful, and no new webhooks were created.
      assert.equal(err.message, `No permission to add a webhook to either repository in this link - you sure you have write permission to either the upstream or fork?`);
    });
  });
  it('should error if a webhook fails to be created', async () => {
    const reposCreateHook = sinon.stub();
      reposCreateHook.onFirstCall().resolves(NO_PERMISSION);
      reposCreateHook.onSecondCall().rejects(new Error('Bad things happened.'));

    const owner = {username: 'ryan'};
    const upstream = {type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'};
    const fork = {type: 'repo', owner: 'hello', repo: 'world', branch: 'master'};

    const link = {
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner,
      upstream,
      fork,
    };

    return addWebhooksForLink({
      github: {
        user: {
          reposCreateHook,
        },
      },
    }, link).then(() => {
      // Shoudn't be successful
      assert(false);
    }).catch(err => {
      // Successful, and no new webhooks were created.
      assert.equal(err.message, `Bad things happened.`);
    })
  });
});

describe('remove webhooks for links', function() {
  it('should do nothing when a webhook already exists on at least one repo', async () => {
    const reposDeleteHook = sinon.stub();
      reposDeleteHook.onFirstCall().rejects({status: 'Not Found'}); // One repository
      reposDeleteHook.onSecondCall().resolves(); // Other repository

    const owner = {username: 'ryan'};
    const upstream = {type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'};
    const fork = {type: 'repo', owner: 'hello', repo: 'world', branch: 'master'};

    const link = {
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner,
      upstream,
      fork,
    };

    return removeOldWebhooksForLink({
      github: {
        user: {
          reposDeleteHook,
        },
      },
    }, link).then(resp => {
      // Successful, and no new webhooks were created.
      assert.equal(resp.length, 1);
    });
  });
  it(`should be a noop when both webhooks were deleted.`, async () => {
    const reposDeleteHook = sinon.stub();
      reposDeleteHook.onFirstCall().rejects({status: 'Not Found'}); // One repository
      reposDeleteHook.onSecondCall().rejects({status: 'Not Found'}); // Other repository

    const owner = {username: 'ryan'};
    const upstream = {type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'};
    const fork = {type: 'repo', owner: 'hello', repo: 'world', branch: 'master'};

    const link = {
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner,
      upstream,
      fork,
    };

    return removeOldWebhooksForLink({
      github: {
        user: {
          reposDeleteHook,
        },
      },
    }, link).then(resp => {
      assert.deepEqual(resp, [true]);
    });
  });
  it('should pass through errors when deleting a webhook fails', async () => {
    const reposDeleteHook = sinon.stub();
      reposDeleteHook.onFirstCall().rejects(new Error('Oh no!')); // One repository
      reposDeleteHook.onSecondCall().resolves(); // Other repository

    const owner = {username: 'ryan'};
    const upstream = {type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'};
    const fork = {type: 'repo', owner: 'hello', repo: 'world', branch: 'master'};

    const link = {
      name: 'My Link',
      enabled: true,
      hookId: ['123456'],
      owner,
      upstream,
      fork,
    };

    return removeOldWebhooksForLink({
      github: {
        user: {
          reposDeleteHook,
        },
      },
    }, link).then(() => {
      // Shoudn't be successful
      assert(false);
    }).catch(err => {
      // Successful, and no new webhooks were created.
      assert.equal(err.message, `Oh no!`);
    })
  });
  it('should do nothing with no webhooks', async () => {
    const reposDeleteHook = sinon.stub();

    const owner = {username: 'ryan'};
    const upstream = {type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'};
    const fork = {type: 'repo', owner: 'hello', repo: 'world', branch: 'master'};

    const link = {
      name: 'My Link',
      enabled: true,
      hookId: [],
      owner,
      upstream,
      fork,
    };

    return removeOldWebhooksForLink({
      github: {
        user: {
          reposDeleteHook,
        },
      },
    }, link).then(resp => {
      assert.deepEqual(resp, []);
    })
  });
  it('should fail silently for malformatted link', async () => {
    const reposDeleteHook = sinon.stub();

    const owner = {username: 'ryan'};
    const upstream = {type: 'repo', owner: 'foo', repo: 'bar', branch: 'master'};
    const fork = {type: 'repo', owner: 'hello', repo: 'world', branch: 'master'};

    const link = {
      name: 'My Link',
      enabled: true,
      /* no hookid */
      owner,
      upstream,
      fork,
    };

    return removeOldWebhooksForLink({
      github: {
        user: {
          reposDeleteHook,
        },
      },
    }, link).then(resp => {
      assert.equal(resp, true);
    })
  });
});
