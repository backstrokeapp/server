import checkRepo from './index';

import sinon from 'sinon';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../test-helpers/issue-request';

const ACCESS_TOKEN = Math.random().toString();

describe('check repo', () => {
  it('should verify a repo exists', () => {
    const authenticate = sinon.spy();
    const get = sinon.stub().resolves({private: false, fork: false});
    const getBranches = sinon.stub().resolves([{name: 'master'}, {name: 'foo'}, {name: 'bar-baz'}]);
    const GithubApi = sinon.stub().returns({
      repos: {get, getBranches},
      authenticate,
    });

    return issueRequest(
      checkRepo, [GithubApi],
      '/v1/repos/github/:user/:repo', {accessToken: ACCESS_TOKEN}, {
        method: 'GET',
        url: `/v1/repos/github/foo/bar`,
      },
    ).then(res => {
      assert.deepEqual(JSON.parse(res.body), {
        valid: true,
        private: false,
        fork: false,
        parent: null,
        branches: ['master', 'foo', 'bar-baz'],
      });

      // Ensure all the methods on GithubApi were called properly
      assert.deepEqual(authenticate.firstCall.args, [{type: 'oauth', token: ACCESS_TOKEN}]);
      assert.deepEqual(get.firstCall.args, [{owner: 'foo', repo: 'bar'}]);
      assert.deepEqual(getBranches.firstCall.args, [{owner: 'foo', repo: 'bar', per_page: 100, page: 0}]);
      assert.deepEqual(getBranches.callCount, 1);
    });
  });
  it('should verify a repo does not exist', () => {
    const authenticate = sinon.spy();
    const get = sinon.stub().rejects(new Error('Not found.'));
    const getBranches = sinon.stub().rejects();
    const GithubApi = sinon.stub().returns({
      repos: {get, getBranches},
      authenticate,
    });

    return issueRequest(
      checkRepo, [GithubApi],
      '/v1/repos/github/:user/:repo', {accessToken: ACCESS_TOKEN}, {
        method: 'GET',
        url: `/v1/repos/github/foo/bar`,
      },
    ).then(res => {
      assert.deepEqual(JSON.parse(res.body), {valid: false});

      // Ensure all the methods on GithubApi were called properly
      assert.deepEqual(authenticate.firstCall.args, [{type: 'oauth', token: ACCESS_TOKEN}]);
      assert.deepEqual(get.firstCall.args, [{owner: 'foo', repo: 'bar'}]);
      assert.equal(getBranches.callCount, 0); /* getBranches wasn't called */
    });
  });
});
