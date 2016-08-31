import assert from 'assert';
import sinon from 'sinon';
import Promise from 'bluebird';

import {get, index, create} from 'controllers/links';
import Link from 'models/Link';
import {generateLink, res} from '../testHelpers';

describe('links controller', function() {
  let loggedIn = {
    isAuthenticated() { return true; },
    user: {
      _id: 'a-user-id',
      provider: 'github',
      picture: 'http://example.com/image.png',
      provider_id: '12345',
      user: 'my-username',
      email: 'me@example.com',
    },
  };

  function params(params) { return {params}; }

  function join() {
    return Object.assign({
      method: 'GET',
      isAuthenticated() { return false; },
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
        Link.find.restore();
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
    it('should get all links when a user has no links', function(done) {
      let LinkMock = sinon.mock(Link).expects('find')
                     .withArgs({owner: loggedIn.user})
                     .chain('exec')
                     .yields(null, [])

      // handle a response
      res(function() {
        LinkMock.verify();
        Link.find.restore();
        assert.deepEqual(res.statusCode, 200);
        assert.deepEqual(res.data, {
          data: [],
          lastId: null,
          totalPrice: 0,
        });
        done();
      });

      index(Link, join(loggedIn), res);
    });
    it('should not expose errors', function(done) {
      let link1 = generateLink(), link2 = generateLink();
      let LinkMock = sinon.mock(Link).expects('find')
                     .withArgs({owner: loggedIn.user})
                     .chain('exec')
                     .yields(new Error('some fancy error'))

      // handle a response
      res(function() {
        LinkMock.verify();
        Link.find.restore();
        assert.deepEqual(res.statusCode, 500);
        assert.deepEqual(res.data, {error: 'Database error.'});
        done();
      });

      index(Link, join(loggedIn), res);
    });
    it('should error if not logged in', function(done) {
      let link1 = generateLink(), link2 = generateLink();

      // handle a response
      res(function() {
        assert.deepEqual(res.statusCode, 403);
        assert.deepEqual(res.data, {error: 'Not authenticated.'});
        done();
      });

      index(Link, join(), res);
    });
  });
  describe('get', function() {
    it('should get a single link specified by the passed id', function(done) {
      let link1 = generateLink();
      let LinkMock = sinon.mock(Link).expects('findOne')
                     .withArgs({_id: link1._id, owner: loggedIn.user})
                     .chain('exec')
                     .yields(null, link1)

      // handle a response
      res(function() {
        LinkMock.verify();
        Link.findOne.restore();
        assert.deepEqual(res.statusCode, 200);
        assert.deepEqual(res.data, link1);
        done();
      });

      get(Link, join(loggedIn, params({id: link1._id})), res);
    });
    it('should error if not logged in', function(done) {
      let link1 = generateLink(), link2 = generateLink();

      // handle a response
      res(function() {
        assert.deepEqual(res.statusCode, 403);
        assert.deepEqual(res.data, {error: 'Not authenticated.'});
        done();
      });

      get(Link, join(params({id: link1._id})), res);
    });
    it('should not expose errors to the user', function(done) {
      let link1 = generateLink();
      let LinkMock = sinon.mock(Link).expects('findOne')
                     .withArgs({_id: link1._id, owner: loggedIn.user})
                     .chain('exec')
                     .yields(new Error('fancy error'))

      // handle a response
      res(function() {
        LinkMock.verify();
        Link.findOne.restore();
        assert.deepEqual(res.statusCode, 500);
        assert.deepEqual(res.data, {error: 'Database error.'});
        done();
      });

      get(Link, join(loggedIn, params({id: link1._id})), res);
    });
  });
  describe('create', function() {
    it('should create a dummy link that can be later updated', function(done) {
      let save = sinon.stub().yields(null);
      let format = sinon.stub().returns({formatted: 'data'});
      let LinkMock = sinon.stub().withArgs().returns({save, format});

      // handle a response
      res(function() {
        assert(LinkMock.calledWithNew());
        assert.deepEqual(res.statusCode, 201);
        assert.deepEqual(res.data, {formatted: 'data'});
        assert(format.withArgs({
          enabled: false,
          owner: "a-user-id",
          to: null,
          from: null,
        }));
        done();
      });

      create(LinkMock, join(loggedIn), res);
    });
    it('should error if not logged in', function(done) {
      let save = sinon.stub().yields(null);
      let LinkMock = sinon.stub().withArgs().returns({save});

      // handle a response
      res(function() {
        assert.deepEqual(res.statusCode, 403);
        assert.deepEqual(res.data, {error: 'Not authenticated.'});
        done();
      });

      create(Link, join(), res);
    });
    it('should not expose errors to the user', function(done) {
      let save = sinon.stub().yields(new Error('an error'));
      let LinkMock = sinon.stub().withArgs().returns({save});

      // handle a response
      res(function() {
        assert.deepEqual(res.statusCode, 500);
        assert.deepEqual(res.data, {error: 'Database error.'});
        done();
      });

      create(Link, join(loggedIn), res);
    });
  });
});
