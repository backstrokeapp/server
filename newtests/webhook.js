import createMockGithubInstance, {
  generateId,
  generateOwner,
  generateRepo,
} from './helpers/createMockGithubInstance';

import {
  didRepoOptOut,
} from '../src/webhook';
import assert from 'assert';

describe('didRepoOptOut', () => {
  it('should make sure a repo is by default not opted out', () => {
    let repository = generateRepo({
      issues: [],
    });
    const gh = createMockGithubInstance([repository]);

    return didRepoOptOut(gh, {owner: repository.owner.login, repo: repository.name}).then(optout => {
      assert.equal(optout, false);
    });
  });
  it('should make sure a repo is opted out when it has the right labels on a PR', () => {
    let repository = generateRepo({
      issues: [
        {
          title: "My sample PR",
          labels: [
            {id: generateId(), name: "optout"},
          ],
        },
      ],
    });
    const gh = createMockGithubInstance([repository]);

    return didRepoOptOut(gh, {owner: repository.owner.login, repo: repository.name}).then(optout => {
      assert.equal(optout, true);
    });
  });
});
