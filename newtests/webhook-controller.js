import {index, get, create, update, del} from '../src/controllers/links';
import request from 'request';

import {Schema} from 'jugglingdb';
import linkBuilder from '../src/models/Link';
import userBuilder from '../src/models/User';
import repositoryBuilder from '../src/models/Repository';
import assert from 'assert';

import express from 'express';
import bodyParser from 'body-parser';
function issueRequest(fn, deps, user=null, mountAt='/', requestParameters={url: '/'}) {
  return new Promise((resolve, reject) => {
    // Create a server with the function mounted at `/`
    let app = express();
    app.use(bodyParser.json());
    app.use((req, res, next) => {
      req.user = user;
      next();
    });
    app.all(mountAt, (req, res) => fn.apply(null, [...deps, req, res]));
    // Listen on a local socket
    app.listen('/Users/ryan/w/1egoman/backstroke/backstroke-tests.sock', () => {
      console.log('listening');
      requestParameters = Object.assign({}, requestParameters, {
        url: `http://unix:/Users/ryan/w/1egoman/backstroke/backstroke-tests.sock:${requestParameters.url}`,
      });
      return request(requestParameters, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  });
}


describe('index', () => {
  let schema,
      Link, User, Repository,
      userData, linkData, upstreamData, forkData;

  before(() => {
    schema = new Schema('memory');
    // console.log(schema);
    Repository = repositoryBuilder(schema);
    User = userBuilder(schema);
    Link = linkBuilder(schema);

    return Promise.all([
      User.create({
        username: 'my-user',
        email: 'foo@example.com',
        picture: 'http://example.com/foo.png',
        providerId: 1,
        accessToken: 'abcdef',
      }),
      Repository.create({ // Upstream
        type: 'repo',
        owner: 'foo',
        repo: 'bar',
        fork: false,
        html_url: 'https://github.com/foo/bar',
        branches: ['master'],
        branch: 'master',
      }),
      Repository.create({ // Fork
        type: 'repo',
        owner: 'foo',
        repo: 'bar',
        fork: false,
        html_url: 'https://github.com/foo/bar',
        branches: ['master'],
        branch: 'master',
      }),
    ]).then(([user, upstream, fork]) => {
      userData = user;
      upstreamData = upstream;
      forkData = fork;
      return Link.create({
        name: 'My Link',
        enabled: true,
        hookId: ['123456'],
        ownerId: user.id,
        upstreamId: upstream.id,
        forkId: fork.id,
      });
    }).then(link => {
      linkData = link;
    });
  });

  after(() => {
    schema = null;
  });

  it.skip('should return all links for a user', () => {
    return issueRequest(index, [Link], userData).then(res => {
      let body = JSON.parse(res.body);
      assert.equal(body.data.length, 1);
      assert.equal(body.data[0].id, linkData.id);
      assert.equal(body.data[0].upstream.id, upstreamData.id);
      assert.equal(body.data[0].fork.id, forkData.id);
      assert.equal(body.data[0].owner.id, userData.id);
    });
  });
  it('should get a link for a user', () => {
    return issueRequest(get, [Link], userData, '/:id', {
      method: 'GET',
      url: `/${userData.id}`,
    }).then(res => {
      let body = JSON.parse(res.body);
      assert.equal(body.id, linkData.id);
      assert.equal(body.upstream.id, upstreamData.id);
      assert.equal(body.fork.id, forkData.id);
      assert.equal(body.owner.id, userData.id);
    });
  });
});
