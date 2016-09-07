import assert from 'assert';
import sinon from 'sinon';
import webhook, {
  generatePullRequestTitle,
  generatePullRequestBody,
  didRepoOptOut,
} from 'webhook/';
import {res, generateLink} from '../testHelpers';
import getRepoName from 'helpers/getRepoName';

let firstForkPage = [{
  type: 'repo',
  provider: 'github',
  name: 'user/fork1',
  private: false,
  fork: true,
  branch: 'master',
  branches: [],
}, {
  type: 'repo',
  provider: 'github',
  name: 'user/fork2',
  private: false,
  fork: true,
  branch: 'master',
  branches: [],
}];

let secondForkPage = [{
  type: 'repo',
  provider: 'github',
  name: 'user/fork3',
  private: false,
  fork: true,
  branch: 'master',
  branches: [],
}];

describe('webhook v2', function() {
  describe('webhook', function() {
    it('should run a webhook with to and from both repos', function() {
      let link1 = generateLink({to: 'repo', from: 'repo'});
      let [user, repo] = getRepoName(link1.from);
      let [childUser, childRepo] = getRepoName(link1.to);
      let pullRequestsCreate = sinon.stub().withArgs({
          user: childUser, repo: childRepo,
          title: generatePullRequestTitle(user, repo),
          head: `${user}:${link1.from.branch}`,
          base: link1.to.branch,
          body: generatePullRequestBody(user, repo),
      }).resolves({created: 'pull request'});

      let gh = {
        pullRequestsGetAll: sinon.stub().withArgs({
          user: childUser,
          repo: childRepo,
          state: 'open',
          head: `${user}:${link1.from.branch}`,
          base: link1.to.branch,
        }).resolves([]),
        searchIssues: sinon.stub().withArgs({
          q: `repo:${childUser}/${childRepo} is:pr label:optout`,
        }).resolves({total_count: 0}),
      };

      return webhook(gh, link1, 2, {pullRequestsCreate}).then(data => {
        assert.equal(data.status, 'ok');
        assert.equal(data.isEnabled, true);
        assert.equal(data.many, false);
        assert.equal(data.forkCount, 1);
        assert.deepEqual(data.pullRequest, {created: 'pull request'});
      });
    });
    it('should run a webhook with to having type fork-all and from having type repo', function() {
      let link1 = generateLink({to: 'fork-all', from: 'repo'});
      let [user, repo] = getRepoName(link1.from);

      // Get user and repo from each fork page
      let [user0, repo0] = getRepoName(firstForkPage[0]);
      let [user1, repo1] = getRepoName(firstForkPage[1]);
      let [user2, repo2] = getRepoName(secondForkPage[0]);

      // Receive 2 pages of forks, the first a full page, and the second with only 1 item (len=2)
      let reposGetForks = sinon.stub();
      reposGetForks.withArgs({user, repo, page: 0, per_page: 2}).resolves([{
        full_name: firstForkPage[0].name,
        private: firstForkPage[0].private,
      }, {
        full_name: firstForkPage[1].name,
        private: firstForkPage[1].private,
      }]);
      reposGetForks.withArgs({user, repo, page: 1, per_page: 2}).resolves([{
        full_name: secondForkPage[0].name,
        private: secondForkPage[0].private,
      }]);

      // Ensure a PR is created for each repo
      let pullRequestsCreate = sinon.stub();
      pullRequestsCreate.withArgs({
          user: user0, repo: repo0,
          title: generatePullRequestTitle(user, repo),
          head: `${user0}:${link1.from.branch}`,
          base: firstForkPage[0].branch,
          body: generatePullRequestBody(user, repo),
      }).resolves({created: 'pull request'});
      pullRequestsCreate.withArgs({
          user: user1, repo: repo1,
          title: generatePullRequestTitle(user, repo),
          head: `${user}:${link1.from.branch}`,
          base: firstForkPage[1].branch,
          body: generatePullRequestBody(user, repo),
      }).resolves({created: 'pull request'});
      pullRequestsCreate.withArgs({
          user: user2, repo: repo2,
          title: generatePullRequestTitle(user, repo),
          head: `${user}:${link1.from.branch}`,
          base: secondForkPage[0].branch,
          body: generatePullRequestBody(user, repo),
      }).resolves({created: 'pull request'});

      // Get All pull requests for each repo
      let pullRequestsGetAll = sinon.stub()
      pullRequestsGetAll.withArgs({
        user: user0,
        repo: repo0,
        state: 'open',
        head: `${user}:${link1.from.branch}`,
        base: firstForkPage[0].branch,
      }).resolves([]);
      pullRequestsGetAll.withArgs({
        user: user1,
        repo: repo1,
        state: 'open',
        head: `${user}:${link1.from.branch}`,
        base: firstForkPage[1].branch,
      }).resolves([]);
      pullRequestsGetAll.withArgs({
        user: user2,
        repo: repo2,
        state: 'open',
        head: `${user}:${link1.from.branch}`,
        base: secondForkPage[0].branch,
      }).resolves([]);

      // Search issues for each repo
      let searchIssues = sinon.stub();
      searchIssues.withArgs({
        q: `repo:${user0}/${repo0} is:pr label:optout`,
      }).resolves({total_count: 0});
      searchIssues.withArgs({
        q: `repo:${user1}/${repo1} is:pr label:optout`,
      }).resolves({total_count: 0});
      searchIssues.withArgs({
        q: `repo:${user2}/${repo2} is:pr label:optout`,
      }).resolves({total_count: 0});

      return webhook({
        pullRequestsGetAll,
        searchIssues,
        reposGetForks,
      }, link1, 2, {
        pullRequestsCreate,
      }).then(output => {
        assert.deepEqual(output, {
          status: 'ok',
          forkCount: 3,
          many: true,
          isEnabled: true,
        });
      });
    });
    it('should not make a pull request for a repo with an existing PR', function() {
      let link1 = generateLink({to: 'repo', from: 'repo'});
      let [user, repo] = getRepoName(link1.from);
      let [childUser, childRepo] = getRepoName(link1.to);
      let pullRequestsCreate = sinon.stub().withArgs({
          user: childUser, repo: childRepo,
          title: generatePullRequestTitle(user, repo),
          head: `${user}:${link1.from.branch}`,
          base: link1.to.branch,
          body: generatePullRequestBody(user, repo),
      }).rejects({code: 422}); // failsure because it aleady exiets

      let gh = {
        searchIssues: sinon.stub().withArgs({
          q: `repo:${childUser}/${childRepo} is:pr label:optout`,
        }).resolves({total_count: 0}),
      };

      return webhook(gh, link1, 2, {pullRequestsCreate}).then(data => {
        assert.equal(data.status, 'ok');
        assert.equal(data.isEnabled, true);
        assert.equal(data.many, false);
        assert.equal(data.forkCount, 1);
        assert.deepEqual(data.pullRequest, {
          msg: "There's already a pull request for this repo, no need to create another.",
        });
      });
    });
    it('should not run a disabled webhook', function() {
      let link1 = generateLink({to: 'repo', from: 'repo'});
      link1.enabled = false;

      return webhook({}, link1, 2, {}).then(output => {
        assert.deepEqual(output, {error: 'not-enabled', isEnabled: false});
      });
    });
    it('should not run a webhook that doesnt have to or from defined (null)', function() {
      let link1 = generateLink({to: 'repo', from: 'repo'});
      link1.to = null;

      return webhook({}, link1, 2, {}).then(output => {
        assert.deepEqual(output, {
          error: 'to-or-from-false',
          isEnabled: true,
          msg: 'Please set both a "to" and "from" on this link.',
        });
      });
    });
    it('should not run a webhook with an invalid "to" type', function() {
      let link1 = generateLink({to: 'repo', from: 'repo'});
      link1.to.type = "bogus"

      assert.throws(() => {
        webhook({}, link1, 2, {});
      }, "No such 'to' type: bogus");
    });
  });

  describe('didRepoOptOut', function() {
    it('should opt out when a backstroke issue is tagged "optout"', function() {
      let searchIssues = sinon.stub().withArgs({q: `repo:user/repo is:pr label:optout`}).resolves({
        total_count: 1,
      });
      return didRepoOptOut({searchIssues}, 'github', {name: 'user/repo', provider: 'github'})
      .then(didOptOut => {
        assert.equal(didOptOut, true);
      });
    });
    it('should by default not opt out', function() {
      let searchIssues = sinon.stub().withArgs({q: `repo:user/repo is:pr label:optout`}).resolves({
        total_count: 0,
      });
      return didRepoOptOut({searchIssues}, 'github', {name: 'user/repo', provider: 'github'})
      .then(didOptOut => {
        assert.equal(didOptOut, false);
      });
    });
    it('should not work outside of github (for now)', function() {
      assert.throws(() => {
        didRepoOptOut({}, 'bogus', {name: 'user/repo', provider: 'bogus'});
      }, 'No such provider bogus');
    });
  });
});
