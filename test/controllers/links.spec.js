import assert from 'assert';
import sinon from 'sinon';
import Promise from 'bluebird';

import {get, index, create, update, enable, del} from 'controllers/links';
import Link from 'models/Link';
import User from 'models/User';
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
      customerId: 'cus_stripeid',
      subscriptionId: 'sub_stripeid',
    },
  };

  function params(params) { return {params}; }
  function body(body) { return {body}; }

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
  describe('update', function() {
    it('should update a link, changing its properties in the database', function() {
      let link1 = generateLink();
      link1.to.fork = true;

      let LinkMock = sinon.mock(Link);
      LinkMock.expects('update')
      .withArgs({_id: 'my-link-id', owner: loggedIn.user}, link1)
      .chain('exec')
      .resolves(link1);
      LinkMock.expects('isValidLink').withArgs(link1).returns({errors: []});

      let isLinkPaid = sinon.stub().resolves(false);
      let addWebhooksForLink = sinon.stub().resolves(false);
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        LinkMock.verify();
        LinkMock.restore();
        assert(isLinkPaid.calledWith(loggedIn.user, link1));
        assert(addWebhooksForLink.calledWith(loggedIn.user, link1));

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.data, {status: 'ok'});
      });

      return update(
        Link,
        User,
        isLinkPaid,
        addWebhooksForLink,
        updatePaidLinks,
        join(loggedIn, params({linkId: 'my-link-id'}), body({link: link1})),
        res
      );
    });
    it('should 500 on a database error', function() {
      let link1 = generateLink();
      link1.to.fork = true;

      let LinkMock = sinon.mock(Link);
      LinkMock.expects('update')
      .withArgs({_id: 'my-link-id', owner: loggedIn.user}, link1)
      .chain('exec')
      .rejects(new Error('some database error'));
      LinkMock.expects('isValidLink').withArgs(link1).returns({errors: []});

      let isLinkPaid = sinon.stub().resolves(false);
      let addWebhooksForLink = sinon.stub().resolves();
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        LinkMock.verify();
        LinkMock.restore();
        assert(isLinkPaid.calledWith(loggedIn.user, link1));
        assert(addWebhooksForLink.calledWith(loggedIn.user, link1));

        assert.equal(res.statusCode, 500);
        assert.deepEqual(res.data, {error: 'Server error'});
      });

      return update(
        Link,
        User,
        isLinkPaid,
        addWebhooksForLink,
        updatePaidLinks,
        join(loggedIn, params({linkId: 'my-link-id'}), body({link: link1})),
        res
      );
    });
    it('should 500 on an unexpected error', function() {
      let link1 = generateLink();
      link1.to.fork = true;
      let isLinkPaid = sinon.stub().rejects(new Error('stuff failed'))
      let addWebhooksForLink = sinon.stub().resolves();
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        assert(isLinkPaid.calledWith(loggedIn.user, link1));
        assert.equal(addWebhooksForLink.callCount, 0);

        assert.equal(res.statusCode, 500);
        assert.deepEqual(res.data, {error: 'Server error'});
      });

      return update(
        Link,
        User,
        isLinkPaid,
        addWebhooksForLink,
        updatePaidLinks,
        join(loggedIn, params({linkId: 'my-link-id'}), body({link: link1})),
        res
      );
    });
    it('should 400 on a bad body schema', function() {
      let link1 = generateLink();
      link1.to.fork = true;
      delete link1.to; // remve part of s=the schema

      let validationError = [
        {
          "property": "instance",
          "message": "requires property \"to\"",
          "schema": {
            "type": "object",
            "properties": {
              "enabled": {
                "type": "boolean"
              },
              "name": {
                "type": "string"
              },
              "paid": {
                "type": "boolean"
              },
              "ephemeralRepo": {
                "type": "boolean"
              },
              "pushUsers": {"items": {"type": "string"}, "type": "array"},
              "from": {
                "type": "object",
                "properties": {
                  "private": {
                    "type": "boolean"
                  },
                  "name": {
                    "type": "string",
                    "pattern": "(.+)\/(.+)"
                  },
                  "provider": {
                    "type": "string",
                    "enum": [
                      "github"
                    ]
                  },
                  "fork": {
                    "type": "boolean"
                  },
                  "branch": {
                    "type": "string"
                  },
                  "branches": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "type": {
                    "type": "string",
                    "pattern": "repo"
                  }
                },
                "required": [
                  "private",
                  "name",
                  "provider",
                  "fork",
                  "branches",
                  "branch",
                  "type"
                ]
              },
              "to": {
                "oneOf": [
                  {
                    "type": "object",
                    "properties": {
                      "private": {
                        "type": "boolean"
                      },
                      "name": {
                        "type": "string",
                        "pattern": "(.+)\/(.+)"
                      },
                      "provider": {
                        "type": "string",
                        "enum": [
                          "github"
                        ]
                      },
                      "fork": {
                        "type": "boolean"
                      },
                      "branch": {
                        "type": "string"
                      },
                      "branches": {
                        "type": "array",
                        "items": {
                          "type": "string"
                        }
                      },
                      "type": {
                        "type": "string",
                        "pattern": "repo"
                      }
                    },
                    "required": [
                      "private",
                      "name",
                      "provider",
                      "fork",
                      "branches",
                      "branch",
                      "type"
                    ]
                  },
                  {
                    "type": "object",
                    "properties": {
                      "type": {
                        "type": "string",
                        "pattern": "fork-all"
                      },
                      "provider": {
                        "type": "string",
                        "pattern": "github"
                      }
                    },
                    "required": [
                      "type",
                      "provider"
                    ]
                  }
                ]
              }
            },
            "required": [
              "enabled",
              "to",
              "from",
              "name"
            ]
          },
          "instance": {
            "_id": "57c20d14202d40988411078d",
            "enabled": true,
            "owner": "57c1784179111d7374647b8f",
            "from": {
              "type": "repo",
              "name": "1egoman\/lunch-app",
              "provider": "github",
              "private": false,
              "fork": false,
              "branch": "master",
              "branches": [
                "master",
                "react"
              ]
            },
            "__v": 0,
            "paid": false,
            "name": "backstroke sync",
            "ephemeralRepo": false,
            "pushUsers": [],
          },
          "name": "required",
          "argument": "to",
          "stack": "instance requires property \"to\""
        }
      ];

      let isLinkPaid = sinon.stub().rejects(new Error('stuff failed'))
      let addWebhooksForLink = sinon.stub().resolves();
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        assert.equal(res.statusCode, 400);
        assert.deepEqual(res.data, validationError);
      });

      return update(
        Link,
        User,
        isLinkPaid,
        addWebhooksForLink,
        updatePaidLinks,
        join(loggedIn, params({linkId: 'my-link-id'}), body({link: link1})),
        res
      );
    });
    it('should restrict `to` repos to a fork', function() {
      let link1 = generateLink();
      link1.to.fork = false;

      let isLinkPaid = sinon.stub().rejects(new Error('stuff failed'))
      let addWebhooksForLink = sinon.stub().resolves();
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        assert.equal(res.statusCode, 400);
        assert.deepEqual(res.data, {error: `The 'to' repo must be a fork.`});
      });

      return update(
        Link,
        User,
        isLinkPaid,
        addWebhooksForLink,
        updatePaidLinks,
        join(loggedIn, params({linkId: 'my-link-id'}), body({link: link1})),
        res
      );
    });
    it('should 400 when there is not a link in the body', function() {
      let link1 = generateLink();
      link1.to.fork = true;

      let isLinkPaid = sinon.stub().rejects(new Error('stuff failed'))
      let addWebhooksForLink = sinon.stub().resolves();
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        assert.equal(res.statusCode, 400);
        assert.deepEqual(res.data, {error: 'No link field in json body.'});
      });

      return update(
        Link,
        User,
        isLinkPaid,
        addWebhooksForLink,
        updatePaidLinks,
        join(loggedIn, params({linkId: 'my-link-id'})),
        res
      );
    });
    it('should 403 when not authenticated', function() {
      let link1 = generateLink();
      link1.to.fork = true;

      let isLinkPaid = sinon.stub().rejects(new Error('stuff failed'))
      let addWebhooksForLink = sinon.stub().resolves();
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        assert.equal(res.statusCode, 403);
        assert.deepEqual(res.data, {error: 'Not authenticated.'});
      });

      return update(
        Link,
        User,
        isLinkPaid,
        addWebhooksForLink,
        updatePaidLinks,
        join(params({linkId: 'my-link-id'}), body({link: link1})), // no `loggedIn`
        res
      );
    });
  });
  describe('enable', function() {
    beforeEach(() => {
      Link.update.restore && Link.update.restore();
      Link.findOne.restore && Link.findOne.restore();
    });

    it('should enable a link so it will run via webhook', function(done) {
      let link1 = generateLink();
      let LinkMock = sinon.mock(Link);
      LinkMock.expects('findOne').withArgs({
        _id: link1._id,
        owner: loggedIn.user,
        paid: true,
      }).chain('exec').resolves(link1);

      LinkMock.expects('update')
        .withArgs({
          _id: link1._id,
          owner: loggedIn.user,
          'to.type': {$exists: true},
          'from.type': {$exists: true},
          name: {$exists: true, $type: 2, $ne: ''},
        }, {enabled: true})
      .chain('exec')
      .resolves({nModified: 1});

      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        console.log(res.statusCode, res.data)
        LinkMock.verify();

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.data, {status: 'ok'});
        done();
      });

      enable(
        Link,
        User,
        updatePaidLinks,
        join(loggedIn, params({linkId: link1._id}), body({enabled: true})),
        res
      );
    })
    it('should disable a link', function(done) {
      let link1 = generateLink();
      let LinkMock = sinon.mock(Link);
      LinkMock.expects('findOne').withArgs({
        _id: link1._id,
        owner: loggedIn.user,
        paid: true,
      }).chain('exec').resolves(link1);

      LinkMock.expects('update')
        .withArgs({
          _id: link1._id,
          owner: loggedIn.user,
          'to.type': {$exists: true},
          'from.type': {$exists: true},
          name: {$exists: true, $type: 2, $ne: ''},
        }, {enabled: false})
      .chain('exec')
      .resolves({nModified: 1});

      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        LinkMock.verify();

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.data, {status: 'ok'});
        done();
      });

      enable(
        Link,
        User,
        updatePaidLinks,
        join(loggedIn, params({linkId: link1._id}), body({enabled: false})),
        res
      );
    });
    it('should change link state on an incomplete state', function(done) {
      let link1 = generateLink();
      let LinkMock = sinon.mock(Link);
      LinkMock.expects('findOne').withArgs({
        _id: link1._id,
        owner: loggedIn.user,
        paid: true,
      }).chain('exec').resolves(link1);
      LinkMock.expects('update').withArgs({
        _id: link1._id,
        owner: loggedIn.user,
        'to.type': {$exists: true},
        'from.type': {$exists: true},
        name: {$exists: true, $type: 2, $ne: ''},
      }, {enabled: true}).chain('exec').resolves({nModified: 0});

      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        LinkMock.verify();

        assert.equal(res.statusCode, 400);
        assert.deepEqual(res.data, {status: 'not-complete'});
        done();
      });

      enable(
        Link,
        User,
        updatePaidLinks,
        join(loggedIn, params({linkId: link1._id}), body({enabled: true})),
        res
      );
    });
    it('should 400 on malformed body', function(done) {
      let link1 = generateLink();
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        assert.equal(res.statusCode, 400);
        assert.deepEqual(res.data, {error: 'Enabled property not specified in the body.'});
        done();
      });

      enable(
        Link,
        User,
        updatePaidLinks,
        join(loggedIn, params({linkId: link1._id}), body({enabled: 'not valid'})),
        res
      );
    });
    it('should 403 when unauthenticated', function(done) {
      let link1 = generateLink();
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        assert.equal(res.statusCode, 403);
        assert.deepEqual(res.data, {error: 'Not authenticated.'});
        done();
      });

      enable(
        Link,
        User,
        updatePaidLinks,
        join(params({linkId: link1._id})), // no loggedIn
        res
      );
    });
    it('should 500 on database error', function(done) {
      let link1 = generateLink();
      let LinkMock = sinon.mock(Link);
      LinkMock.expects('findOne').withArgs({
        _id: link1._id,
        owner: loggedIn.user,
        paid: true,
      }).chain('exec').resolves(link1);
      LinkMock.expects('update').withArgs({
        _id: link1._id,
        owner: loggedIn.user,
        'to.type': {$exists: true},
        'from.type': {$exists: true},
        name: {$exists: true, $type: 2, $ne: ''},
      }, {enabled: false})
      .chain('exec')
      .rejects(new Error('a fancy error'));

      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        LinkMock.verify();

        assert.equal(res.statusCode, 500);
        assert.deepEqual(res.data, {error: 'Database error.'});
        done();
      });

      enable(
        Link,
        User,
        updatePaidLinks,
        join(loggedIn, params({linkId: link1._id}), body({enabled: false})),
        res
      );
    });
  });
  describe('delete', function() {
    it('should delete a link when it is no longer needed', function(done) {
      let link1 = generateLink();
      let LinkMock = sinon.mock(Link).expects('remove')
      .withArgs({_id: link1._id, owner: loggedIn.user})
      .chain('exec')
      .resolves(true);
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        console.log(res)
        LinkMock.verify();
        Link.remove.restore();

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.data, {status: 'ok'});
        done();
      });

      del(
        Link,
        User,
        updatePaidLinks,
        join(loggedIn, params({id: link1._id})),
        res
      );
    });
    it('should handle errors when a link delete fails', function(done) {
      let link1 = generateLink();
      let LinkMock = sinon.mock(Link).expects('remove')
      .withArgs({_id: link1._id, owner: loggedIn.user})
      .chain('exec')
      .rejects(new Error('screaming'));
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        LinkMock.verify();
        Link.remove.restore();

        assert.equal(res.statusCode, 500);
        assert.deepEqual(res.data, {error: 'Database error.'});
        done();
      });

      del(
        Link,
        User,
        updatePaidLinks,
        join(loggedIn, params({id: link1._id})),
        res
      );
    });
    it('should 403 when unauthenticated', function(done) {
      let link1 = generateLink();
      let updatePaidLinks = sinon.stub().resolves(true); // update payments perfectly

      res(function() {
        assert.equal(res.statusCode, 403);
        assert.deepEqual(res.data, {error: 'Not authenticated.'});
        done();
      });

      del(
        Link,
        User,
        updatePaidLinks,
        join(params({id: link1._id})), // no loggedIn
        res
      );
    });
  });
});
