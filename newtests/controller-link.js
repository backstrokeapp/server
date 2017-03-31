import {index, get, create, update, enable, del} from '../src/controllers/links';
import sinon from 'sinon';

import {Schema} from 'jugglingdb';
import linkBuilder from '../src/models/Link';
import userBuilder from '../src/models/User';
import repositoryBuilder from '../src/models/Repository';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
import issueRequest from './helpers/issueRequest';
import db from './helpers/createDatabaseModelInstances';

describe('link routes', () => {
  let userData, linkData, upstreamData, forkData;

  before(function() {
    this.timeout(5000);
    return Promise.all([
      db.makeUser(),
      db.makeRepository('repo'), // Upstream
      db.makeRepository('repo'), // Fork
    ]).then(([user, upstream, fork]) => {
      userData = user;
      upstreamData = upstream;
      forkData = fork;
      return db.makeLink({
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

  it('should return all links for a user', () => {
    return issueRequest(
      index, [db.Link],
      '/', userData, {
        method: 'GET',
        url: '/',
        json: true,
      }
    ).then(res => {
      let body = res.body;
      assert.equal(body.data.length, 1);
      assert.equal(body.data[0].id, linkData.id);
      assert.equal(body.data[0].upstream.id, upstreamData.id);
      assert.equal(body.data[0].fork.id, forkData.id);
      assert.equal(body.data[0].owner.id, userData.id);
    });
  });

  it('should get a link for a user', () => {
    return issueRequest(
      get, [db.Link],
      '/:id', userData, {
        method: 'GET',
        url: `/${userData.id}`,
        json: true,
      }
    ).then(res => {
      let body = res.body;
      assert.equal(body.id, linkData.id);
      assert.equal(body.upstream.id, upstreamData.id);
      assert.equal(body.fork.id, forkData.id);
      assert.equal(body.owner.id, userData.id);
    });
  });
  it('should create a link for a user', () => {
    return issueRequest(
      create, [db.Link],
      '/', userData, {
        method: 'POST',
        url: '/',
        json: true,
      }
    ).then(res => {
      let body = res.body;
      assert.notEqual(body.id, linkData.id); // Make sure the id is something else.
      assert.equal(body.upstreamId, undefined);
      assert.equal(body.forkId, undefined);
      assert.equal(body.ownerId, userData.id);

      return db.Link.findOne({where: {id: body.id}});
    }).then(link => {
      assert.equal(link.enabled, false);
    });
  });

  it('should update a link for a user', () => {
    const addWebhooksForLink = sinon.stub().resolves(['98765']);
    const removeOldWebhooksForLink = sinon.stub().resolves();

    return issueRequest(
      update, [db.Link, db.Repository, addWebhooksForLink, removeOldWebhooksForLink],
      '/:linkId', userData, {
        method: 'PUT',
        url: `/${linkData.id}`,
        json: true,
        body: {
          link: {
            name: 'Another name for my link!',
            upstream: upstreamData.id,
            fork: forkData.id,
          },
        },
      }
    ).then(res => {
      let body = res.body;
      assert.equal(body.id, linkData.id);
      assert.equal(body.upstreamId, upstreamData.id);
      assert.equal(body.forkId, forkData.id);
      assert.equal(body.forkId, forkData.id);
      assert.equal(body.name, 'Another name for my link!');

      return db.Link.findOne({where: {id: linkData.id}});
    }).then(link => {
      assert.equal(link.name, 'Another name for my link!');
    });
  });
  it('should update a link with a new upstream', () => {
    const addWebhooksForLink = sinon.stub().resolves(['98765']);
    const removeOldWebhooksForLink = sinon.stub().resolves();

    // First, remove the upstream id from the link to test against.
    return linkData.updateAttribute('upstreamId', null).then(() => {
      return issueRequest(
        update, [db.Link, db.Repository, addWebhooksForLink, removeOldWebhooksForLink],
        '/:linkId', userData, {
          method: 'PUT',
          url: `/${linkData.id}`,
          json: true,
          body: {
            link: {
              name: 'Another name for my link!',
              upstream: {
                type: 'repo',
                owner: 'foo',
                repo: 'bar',
                branches: ['master'],
                branch: 'master',
              },
              fork: forkData.id,
            },
          },
        }
      );
    }).then(res => {
      let body = res.body;
      assert.equal(body.id, linkData.id);
      assert.equal(body.forkId, forkData.id);
      assert.equal(body.name, 'Another name for my link!');

      return db.Link.findOne({where: {id: linkData.id}});
    }).then(link => {
      assert.equal(link.name, 'Another name for my link!');
      assert.notEqual(link.upstreamId, upstreamData.id); // Make sure a new upstream was created
    });
  });

  it('should enable a link for a user', () => {
    const enabledState = !linkData.enabled;
    return issueRequest(
      enable, [db.Link],
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
      return db.Link.findOne({where: {id: linkData.id}});
    }).then(link => {
      assert.equal(link.enabled, enabledState);
    })
  });
  it('should delete a link for a user', () => {
    const enabledState = !linkData.enabled;
    return issueRequest(
      del, [db.Link],
      '/:id', userData, {
        method: 'DELETE',
        url: `/${linkData.id}`,
        json: true,
      }
    ).then(res => {
      assert.equal(res.statusCode, 204);
      return db.Link.findOne({where: {id: linkData.id}});
    }).then(link => {
      assert.equal(link, null); // Link no longer exists.
    });
  });
});
