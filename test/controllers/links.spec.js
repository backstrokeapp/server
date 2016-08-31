import assert from 'assert';
import sinon from 'sinon';
import Promise from 'bluebird';

import {get, index} from 'controllers/links';
import Link from 'models/Link';
import {generateLink, res} from '../testHelpers';

describe('links controller', function() {
  let loggedIn = {
    isAuthenticated() {
      return true;
    },
    user: {
      _id: 'a-user-id',
      provider: 'github',
      picture: 'http://example.com/image.png',
      provider_id: '12345',
      user: 'my-username',
      email: 'me@example.com',
    },
  };

  function join() {
    return Object.assign({
      method: 'GET',
    }, ...arguments);
  }

  describe('index', function() {
    it('should get all links assigned to a user', function(done) {
      let link1 = generateLink(), link2 = generateLink();
      let LinkMock = sinon.mock(Link).expects('find')
                     .withArgs({owner: loggedIn.user})
                     .chain('exec')
                     .yields(null, [link1, link2])

      // handle a response
      res(function() {
        LinkMock.verify();
        Link.find.restore()
        assert.deepEqual(res.statusCode, 200);
        assert.deepEqual(res.data, {
          data: [
            {_id: link1._id, name: link1.name, enabled: link1.enabled, paid: link1.paid},
            {_id: link2._id, name: link2.name, enabled: link2.enabled, paid: link2.paid},
          ],
          lastId: link2._id,
          totalPrice: 0,
        });
        done();
      });

      index(Link, join(loggedIn), res);
    });
    it('should error if not logged in', function(done) {
      let link1 = generateLink(), link2 = generateLink();
      let LinkMock = sinon.mock(Link).expects('find')
                     .withArgs({owner: loggedIn.user})
                     .chain('exec')
                     .yields(null, [link1, link2])

      // handle a response
      res(function() {
        LinkMock.verify();
        Link.find.restore()
        assert.deepEqual(res.statusCode, 200);
        assert.deepEqual(res.data, {
          data: [
            {_id: link1._id, name: link1.name, enabled: link1.enabled, paid: link1.paid},
            {_id: link2._id, name: link2.name, enabled: link2.enabled, paid: link2.paid},
          ],
          lastId: link2._id,
          totalPrice: 0,
        });
        done();
      });

      index(Link, join(loggedIn), res);
    });
    it('should not expose errors to the user');
  });
  describe('get', function() {
    it('should get a single link specified by the passed id');
    it('should error if not logged in');
    it('should not expose errors to the user');
  });
  describe('create', function() {
    it('should create a dummy link that can be later updated');
    it('should error if not logged in');
    it('should not expose errors to the user');
  });
});
