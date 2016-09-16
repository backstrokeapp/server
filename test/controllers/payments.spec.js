import assert from 'assert';
import sinon from 'sinon';
import Promise from 'bluebird';
import proxyquire from 'proxyquire';
import {generateLink} from '../testHelpers';

import stripeFactory from 'stripe';
const realStripe = stripeFactory(process.env.STRIPE_TOKEN);

import Link from 'models/Link';
import User from 'models/User';

describe('payments', function() {
  let stripe, payments, isLinkPaid;
  beforeEach(() => {
    stripe = {
      subscriptions: sinon.mock(realStripe.subscriptions),
    };
    isLinkPaid = sinon.stub();
    payments = proxyquire('controllers/payments', {
      stripe: () => realStripe,
      'helpers/isLinkPaid': {default: isLinkPaid},
    })
  });

  describe('changePaidLinkQuantity', function() {
    it(`should create a new subscription when one doesn't exist for a customer`);
    it(`should create a new subscription when getting a subscription fails`);
    it(`should update stripe subscription when there is a change in payments`);
    it(`should fail when a customer isn't defined on a user`);
  });
  describe('updatePaidLinks', function() {
    it(`should do nothing when a user has only non private/non paid links`, function() {
      let user = {user: 'userName', provider: 'github'};
      let links = [generateLink({paid: false}), generateLink({paid: false})];
      isLinkPaid.resolves(false); // no paid links

      let LinkMock = sinon.mock(Link).expects('find').withArgs({
        owner: user,
        enabled: true,
      }).chain('exec').resolves(links);

      return payments.updatePaidLinks(Link, User, user).then(output => {
        LinkMock.verify();
        Link.find.restore();
        assert.equal(output, true);
      });
    });
    it(`should register paid links with stripe`, function() {
      let user = {
        user: 'userName',
        provider: 'github',
        customerId: 'cus_customerid',
        subscriptionId: 'sub_subscriptionid',
      };
      let links = [generateLink({paid: false}), generateLink({paid: false})];

      // one paid link
      isLinkPaid.onFirstCall().resolves(false);
      isLinkPaid.onSecondCall().resolves(true);

      let LinkMock = sinon.mock(Link).expects('find').withArgs({
        owner: user,
        enabled: true,
      }).chain('exec').resolves(links);

      stripe.subscriptions.expects('retrieve').withArgs(user.subscriptionId).resolves({
        id: user.subscriptionId
      });
      stripe.subscriptions.expects('update').withArgs(user.subscriptionId, {
        quantity: payments.getPaymentQuantityForLinks(1),
        metadata: {repos: 1},
      }).resolves({updated: 'successful'});

      return payments.updatePaidLinks(Link, User, user).then(output => {
        LinkMock.verify();
        Link.find.restore();
        assert.deepEqual(output, {updated: 'successful'});
      });
    });
  });
  describe('getSubscriptionInformation', function() {
    it(`should get subscription info for a user`);
    it(`should handle errors`);
    it(`should error when a user doesn't have a subscription`);
    it(`should error when a user isn't logged in`);
  });
});
