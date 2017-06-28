import list from './list';
import get from './get';
import create from './create';
import enable from './enable';
import del from './delete';
import update from './update';

import sinon from 'sinon';

import {Schema} from 'jugglingdb';
import linkBuilder from '../../models/Link';
import userBuilder from '../../models/User';
import repositoryBuilder from '../../models/Repository';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../test-helpers/issue-request';
import MockModel from '../../test-helpers/mock-model';

const User = new MockModel(),
      Repository = new MockModel(),
      Link = new MockModel([], {upstream: Repository, owner: User, fork: Repository});

Link.methods.display = function() { return this; }

describe('link routes', () => {
  let userData, linkData, upstreamData, forkData;

  before(function() {
    return Promise.all([
      User.create({username: 'ryan'}),
      Repository.create({type: 'repo'}), // Upstream
      Repository.create({type: 'repo'}), // Fork
    ]).then(([user, upstream, fork]) => {
      userData = user;
      upstreamData = upstream;
      forkData = fork;
      return Link.create({
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
      list, [Link],
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
    const linkModel = Link.models[0];
    return issueRequest(
      get, [Link],
      '/:id', userData, {
        method: 'GET',
        url: `/${linkModel.id}`,
        json: true,
      }
    ).then(res => {
      const body = res.body;
      assert.equal(body.id, linkModel.id);
    });
  });
  it('should create a link for a user', () => {
    return issueRequest(
      create, [Link],
      '/', userData, {
        method: 'POST',
        url: '/',
        json: true,
      }
    ).then(res => {
      let body = res.body;
      assert.notEqual(body.id, linkData.id); // Make sure the id is something else.
      return Link.findOne({where: {id: body.id}});
    }).then(link => {
      assert.equal(link.enabled, false);
    });
  });

  it('should update a link for a user', () => {
    const addWebhooksForLink = sinon.stub().resolves(['98765']);
    const removeOldWebhooksForLink = sinon.stub().resolves();

    return issueRequest(
      update, [Link, Repository, addWebhooksForLink, removeOldWebhooksForLink],
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

      return Link.findOne({where: {id: linkData.id}});
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
        update, [Link, Repository, addWebhooksForLink, removeOldWebhooksForLink],
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

      return Link.findOne({where: {id: linkData.id}});
    }).then(link => {
      assert.equal(link.name, 'Another name for my link!');
      assert.notEqual(link.upstreamId, upstreamData.id); // Make sure a new upstream was created
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
  it('should delete a link for a user', () => {
    const removeOldWebhooksForLink = sinon.stub().resolves(true);
    return issueRequest(
      del, [Link, removeOldWebhooksForLink],
      '/:id', userData, {
        method: 'DELETE',
        url: `/${linkData.id}`,
        json: true,
      }
    ).then(res => {
      assert.equal(res.statusCode, 200);
      return Link.findOne({where: {id: linkData.id}});
    }).then(link => {
      assert.equal(link, null); // Link no longer exists.
    });
  });
});
