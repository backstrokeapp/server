import list from './';

import sinon from 'sinon';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../../test-helpers/issue-request';
import MockModel from '../../../test-helpers/mock-model';

const User = new MockModel(),
      Link = new MockModel([], {owner: User});

Link.methods.display = function() { return this; }

describe('link list', () => {
  let userData, linkData;

  beforeEach(function() {
    return Promise.all([
      User.create({username: 'ryan'}),
    ]).then(([user]) => {
      userData = user;
      return Link.create({
        name: 'My Link',
        enabled: true,
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
      const body = res.body;
      assert.equal(body.data.length, 1);
      assert.equal(body.data[0].id, linkData.id);
    });
  });
});
