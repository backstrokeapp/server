import proxyquire from 'proxyquire';
import sinon from 'sinon';
import assert from 'assert';
import {
  getUpstream,
  postUpdate,
} from "../src/remote";
import Promise from 'bluebird';

describe("github", function() {
  describe("hasDivergedFromUpstream", function() {
    describe("diverging repo and upstream", function() {
      let remote, gh;
      beforeEach(function() {
        gh = require('../src/github');
        let reposGetBranch = sinon.stub();
        // fork (user/repo)
        reposGetBranch.withArgs({user: "user", repo: "repo", branch: "master"}).resolves({
          commit: {
            sha: "forkRepoCommitSha",
          },
        });
        // upstream (parent/upstream_repo)
        reposGetBranch.withArgs({user: "parent", repo: "upstream_repo", branch: "master"}).resolves({
          commit: {
            sha: "upstreamRepoCommitSha",
          },
        });

        // mock the github constructor
        let ghMock = {
          reposGet: sinon.stub().withArgs("user", "repo").resolves({
            parent: {
              owner: {
                login: "parent",
              },
              name: "upstream_repo",
              default_branch: "master",
            },
            default_branch: "master",
          }),
          reposGetBranch,
        };
        sinon.stub(gh, "constructor").returns(ghMock);

        // run remote code using the above mock
        remote = proxyquire("../src/remote", {
          './github': gh,
        });
      });
      afterEach(() => gh.constructor.restore());
      it("should detect an repo that has diverged from its upstream", function() {
        return remote.hasDivergedFromUpstream("github", "user", "repo").then(out => {
          assert.equal(out.diverged, true);
          assert.equal(out.baseSha, "forkRepoCommitSha");
          assert.equal(out.upstreamSha, "upstreamRepoCommitSha");
        });
      });
    });
    describe("diverging repo and upstream", function() {
      let remote, gh;
      beforeEach(function() {
        gh = require('../src/github');
        let reposGetBranch = sinon.stub();
        // fork (user/repo)
        reposGetBranch.withArgs({user: "user", repo: "repo", branch: "master"}).resolves({
          commit: { sha: "commonSha", },
        });
        // upstream (parent/upstream_repo)
        reposGetBranch.withArgs({user: "parent", repo: "upstream_repo", branch: "master"}).resolves({
          commit: { sha: "commonSha", },
        });

        // mock the github constructor
        let ghMock = {
          reposGet: sinon.stub().withArgs("user", "repo").resolves({
            parent: {
              owner: {
                login: "parent",
              },
              name: "upstream_repo",
              default_branch: "master",
            },
            default_branch: "master",
          }),
          reposGetBranch,
        };
        sinon.stub(gh, "constructor").returns(ghMock);

        // run remote code using the above mock
        remote = proxyquire("../src/remote", { './github': gh, });
      });
      afterEach(() => gh.constructor.restore());
      it("should detect a repo that has not diverged from its upstream", function() {
        return remote.hasDivergedFromUpstream("github", "user", "repo").then(out => {
          assert.equal(out.diverged, false);
          assert.equal(out.baseSha, "commonSha");
          assert.equal(out.upstreamSha, "commonSha");
        });
      });
    });
  });

  describe("didUserOptOut", function() {
    describe("with a pr made with the label 'optout'", function() {
      let remote, gh;
      beforeEach(function() {
        gh = require('../src/github');

        // mock the github constructor
        let ghMock = {
          searchIssues: sinon.stub().withArgs({
            q: "repo:user/repo is:pr label:output",
          }).resolves({
            total_count: 1,
            issues: [
              { number: 1, }
            ]
          }),
        };
        sinon.stub(gh, "constructor").returns(ghMock);

        // run remote code using the above mock
        remote = proxyquire("../src/remote", {
          './github': gh,
        });
      });
      afterEach(() => gh.constructor.restore());
      it("should detect a user that opted out", function() {
        return remote.didUserOptOut("github", "user", "repo").then(out => {
          assert.equal(out, true);
        });
      });
    });
    describe("with no prs at all", function() {
      let remote, gh;
      beforeEach(function() {
        gh = require('../src/github');

        // mock the github constructor
        let ghMock = {
          searchIssues: sinon.stub().withArgs({
            q: "repo:user/repo is:pr label:output",
          }).resolves({
            total_count: 0,
            issues: [],
          }),
        };
        sinon.stub(gh, "constructor").returns(ghMock);

        // run remote code using the above mock
        remote = proxyquire("../src/remote", {
          './github': gh,
        });
      });
      afterEach(() => gh.constructor.restore());
      it("should detect a user that opted out", function() {
        return remote.didUserOptOut("github", "user", "repo").then(out => {
          assert.equal(out, false);
        });
      });
    });
  });

  describe("postUpdate", function() {
    it("should not continue if passed repo isn't a fork", function() {
      return postUpdate("github", {
        fork: false,
        default_branch: "master",
        owner: { login: "user" },
        name: "repo",
        full_name: "user/repo",
        default_branch: "master",
      }, "pullRequestHeadSha").then(out => {
        assert.equal("Shouldn't have resolved", false);
      }).catch(err => {
        assert.equal(err.message, "The repository user/repo isn't a fork.");
      });
    });
    it("should not continue is repository is undefined", function() {
      return postUpdate("github", null, "pullRequestHeadSha").then(out => {
        assert.equal("Shouldn't have resolved", false);
      }).catch(err => {
        assert.equal(err.message, "No repository found");
      })
    });

    describe("with a PR that's already been made", function() {
      let remote, gh;
      beforeEach(function() {
        gh = require('../src/github');

        // mock the github constructor
        let ghMock = {
          pullRequestsGetAll: sinon.stub().withArgs({
            user: "user",
            repo: "repo",
            state: "open",
            head: "parent/parentRepo",
          }).resolves([{
            head: {sha: "pullRequestHeadSha"},
          }]),
          pullRequestsCreate: sinon.stub().rejects(), // shouldn't get here
        };
        sinon.stub(gh, "constructor").returns(ghMock);

        // run remote code using the above mock
        remote = proxyquire("../src/remote", {
          './github': gh,
        });
      });
      afterEach(() => gh.constructor.restore());
      it("should not post an update on a PR that's already been made", function() {
        return remote.postUpdate("github", {
          parent: {
            owner: {
              login: "userParent",
            },
            name: "parent",
            default_branch: "master",
          },
          fork: true,
          default_branch: "master",
          owner: { login: "user" },
          name: "repo",
          default_branch: "master",
        }, "pullRequestHeadSha").then(out => {
          assert.equal("Shouldn't have resolved", false);
        }).catch(err => {
          assert.equal(err.message, "The PR already has been made.");
        })
      });
    });
    describe("with no PR made", function() {
      let remote, gh;
      beforeEach(function() {
        gh = require('../src/github');

        // mock the github constructor
        let ghMock = {
          pullRequestsGetAll: sinon.stub().withArgs({
            user: "user",
            repo: "repo",
            state: "open",
            head: "parent/parentRepo",
          }).resolves([{
            head: {sha: "pullRequestHeadSha"},
          }]),
          pullRequestsCreate: sinon.stub().resolves({
            createdPR: true,
          }),
        };
        sinon.stub(gh, "constructor").returns(ghMock);

        // run remote code using the above mock
        remote = proxyquire("../src/remote", {
          './github': gh,
        });
      });
      afterEach(() => gh.constructor.restore());
      it("should not post an update on a PR that's already been made", function() {
        return remote.postUpdate("github", {
          parent: {
            owner: {
              login: "userParent",
            },
            name: "parent",
            default_branch: "master",
          },
          fork: true,
          default_branch: "master",
          owner: { login: "user" },
          name: "repo",
          default_branch: "master",
        }, "aDifferentSha").then(out => {
          assert.deepEqual(out, {createdPR: true});
        });
      });
    });
  });

  describe("getUpstream", function() {
    it("should get a custom upstream when upstream opt is set", function() {
      let out = getUpstream({
        parent: {
          owner: {
            login: "user",
          },
          name: "parent",
          default_branch: "master",
        },
        default_branch: "master",
      }, {
        upstream: "myuser/upstream",
      });
      assert.deepEqual(out, {user: "myuser", repo: "upstream"});
    });
    it("should get a custom upstream even without a repo", function() {
      let out = getUpstream(null, {
        upstream: "myuser/upstream",
      });
      assert.deepEqual(out, {user: "myuser", repo: "upstream"});
    });
    it("should get the upstream when the current repo is the upstream", function() {
      let out = getUpstream({
        owner: { login: "user" },
        name: "repo",
        default_branch: "master",
      });
      assert.deepEqual(out, {user: "user", repo: "repo"});
    });
    it("should get the upstream the current repo is the fork", function() {
      let out = getUpstream({
        parent: {
          owner: {
            login: "userParent",
          },
          name: "parent",
          default_branch: "master",
        },
        fork: true,
        default_branch: "master",
        owner: { login: "user" },
        name: "repo",
        default_branch: "master",
      });
      assert.deepEqual(out, {user: "userParent", repo: "parent"});
    });
  });
});

describe("routes", function() {
  describe("with an upstream repo", function() {
    it("should update all forks when pushed to");
  });
  describe("with a forked repo", function() {
    it("should update the specific fork");
  });
});
