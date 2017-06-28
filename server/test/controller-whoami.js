import whoami from '../src/controllers/whoami';
import sinon from 'sinon';

import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
import issueRequest from './helpers/issueRequest';

// Helper for managing database instances
import db from './helpers/createDatabaseModelInstances';

describe('whoami route', () => {
  let userData;

  beforeEach(() => {
    return db.makeUser().then(user => {
      userData = user;
    });
  });

  afterEach(() => {
    return db.reset();
  });

  it('should make sure a user is not logged in', () => {
    return issueRequest(
      whoami, [],
      '/', null // No user data
    ).then(res => {
      assert.equal(res.statusCode, 401);
      assert.deepEqual(JSON.parse(res.body), {error: 'Not logged in.'});
    });
  });
  it('should make sure a user is logged in', () => {
    return issueRequest(
      whoami, [],
      '/', userData // No user data
    ).then(res => {
      const body = JSON.parse(res.body);
      assert.equal(res.statusCode, 200);

      // FIXME: shouldn't have to do the comparison like this
      assert.deepEqual(res.body, JSON.stringify(userData));
    });
  });
});
