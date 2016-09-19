import assert from 'assert';
import sinon from 'sinon';
import Promise from 'bluebird';
import proxyquire from 'proxyquire';
import {generateLink, res} from '../testHelpers';

import stripeFactory from 'stripe';
const realStripe = stripeFactory(process.env.STRIPE_TOKEN);

import Link from 'models/Link';
import User from 'models/User';

describe('payments', function() {
  let stripe, payments, isLinkPaid;
  beforeEach(() => {
    if (stripe) {
      stripe.subscriptions.restore();
    }
    stripe = {
      subscriptions: sinon.mock(realStripe.subscriptions),
    };
    isLinkPaid = sinon.stub();
    payments = proxyquire('controllers/payments', {
      stripe: () => realStripe,
      'helpers/isLinkPaid': {default: isLinkPaid},
    });
  });

  describe('changePaidLinkQuantity', function() {
    it(`should create a new subscription when one doesn't exist for a customer`, function() {
      let user = {
        _id: 'userid',
        user: 'userName',
        provider: 'github',
        customerId: 'cus_customerid',
        subscriptionId: null,
      };

      // NOTE: below resolves a null subscription
      stripe.subscriptions.expects('retrieve').withArgs(user.subscriptionId).resolves(null);
      stripe.subscriptions.expects('create').withArgs({
        customer: user.customerId,
        plan: 'premium_link',
        quantity: payments.getPaymentQuantityForLinks(3),
        metadata: {repos: 3},
      }).resolves({
        id: 'sub_new_subscriptionid',
      });

      let exec = sinon.stub().resolves({updated: 'user'});
      sinon.stub(User, 'update').withArgs({_id: user._id}, {
        subscriptionId: 'sub_new_subscriptionid',
      }).returns({exec});

      return payments.changePaidLinkQuantity(User, user, 3).then(output => {
        User.update.restore();
        assert.deepEqual(output, {updated: 'user'});
      });
    });
    it(`should create a new subscription when getting a subscription fails`, function() {
      let user = {
        _id: 'userid',
        user: 'userName',
        provider: 'github',
        customerId: 'cus_customerid',
        subscriptionId: null,
      };

      // NOTE: below rejects.
      stripe.subscriptions.expects('retrieve').withArgs(user.subscriptionId).rejects();
      stripe.subscriptions.expects('create').withArgs({
        customer: user.customerId,
        plan: 'premium_link',
        quantity: payments.getPaymentQuantityForLinks(3),
        metadata: {repos: 3},
      }).resolves({
        id: 'sub_new_subscriptionid',
      });

      let exec = sinon.stub().resolves({updated: 'user'});
      sinon.stub(User, 'update').withArgs({_id: user._id}, {
        subscriptionId: 'sub_new_subscriptionid',
      }).returns({exec});

      return payments.changePaidLinkQuantity(User, user, 3).then(output => {
        User.update.restore();
        assert.deepEqual(output, {updated: 'user'});
      });
    });
    it(`should update stripe subscription when there is a change in payments`, function() {
      let user = {
        _id: 'userid',
        user: 'userName',
        provider: 'github',
        customerId: 'cus_customerid',
        subscriptionId: 'sub_subscriptionid',
      };

      // NOTE: below resolves the above subscritionid
      stripe.subscriptions.expects('retrieve').withArgs(user.subscriptionId).resolves({
        id: user.subscriptionId,
      });
      stripe.subscriptions.expects('update').withArgs(user.subscriptionId, {
        quantity: payments.getPaymentQuantityForLinks(3),
        metadata: {repos: 3},
      }).resolves({updated: 'user'});

      return payments.changePaidLinkQuantity(User, user, 3).then(output => {
        assert.deepEqual(output, {updated: 'user'});
      });
    });
    it(`should fail when a customer isn't defined on a user`, function() {
      let user = {
        _id: 'userid',
        user: 'userName',
        provider: 'github',
        customerId: null, // not in stripe yet
        subscriptionId: null,
      };

      return payments.changePaidLinkQuantity(User, user, 3).catch(output => {
        assert(output instanceof Error);
        assert.deepEqual(output.message, 'Payment info not specified.');
      });
    });
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
    it(`should get subscription info for a user`, function(done) {
      let user = {
        _id: 'userid',
        user: 'userName',
        provider: 'github',
        customerId: 'cus_customerid',
        subscriptionId: 'sub_subscriptionid',
      };

      stripe.subscriptions.expects('retrieve').withArgs(user.subscriptionId).resolves({
        quantity: 5,
        plan: {
          amount: 500, // 5 bucks for five repos
        },
      });

      res(function() {
        stripe.subscriptions.verify();
        assert.deepEqual(res.statusCode, 200);
        assert.deepEqual(res.data, {
          status: 'ok',
          paymentBlockQuantity: 5,
          paymentAmount: 25.00,
        });
        done();
      });

      payments.getSubscriptionInformation(
        {user, isAuthenticated: () => true},
        res
      );

    });
    it(`should handle errors`, function(done) {
      let user = {
        _id: 'userid',
        user: 'userName',
        provider: 'github',
        customerId: 'cus_customerid',
        subscriptionId: 'sub_subscriptionid',
      };

      stripe.subscriptions.expects('retrieve').withArgs(user.subscriptionId).rejects(
        new Error('More than explosions')
      );

      res(function() {
        stripe.subscriptions.verify();
        assert.deepEqual(res.statusCode, 500);
        assert.deepEqual(res.data, {error: 'Server error'});
        done();
      });

      payments.getSubscriptionInformation(
        {user, isAuthenticated: () => true},
        res
      );
    });
    it(`should return zeros when a user doesn't have a subscription`, function(done) {
      let user = {
        _id: 'userid',
        user: 'userName',
        provider: 'github',
        customerId: 'cus_customerid',
        subscriptionId: null,
      };

      res(function() {
        assert.deepEqual(res.statusCode, 200);
        assert.deepEqual(res.data, {
          status: 'ok',
          paymentBlockQuantity: 0,
          paymentAmount: 0,
          note: 'No subscription on the authenticated user.'
        });
        done();
      });

      payments.getSubscriptionInformation(
        {user, isAuthenticated: () => true},
        res
      );
    });
    it(`should error when a user isn't logged in`, function(done) {
      res(function() {
        assert.deepEqual(res.statusCode, 403);
        assert.deepEqual(res.data, {error: 'Not authenticated.'});
        done();
      });

      payments.getSubscriptionInformation(
        {isAuthenticated: () => false},
        res
      );
    });
  });

  it('should test getPaymentQuantityForLinks', function() {
    assert.equal(payments.getPaymentQuantityForLinks( 0), 0);
    assert.equal(payments.getPaymentQuantityForLinks( 1), 1);
    assert.equal(payments.getPaymentQuantityForLinks( 2), 2);
    assert.equal(payments.getPaymentQuantityForLinks( 3), 3);
    assert.equal(payments.getPaymentQuantityForLinks( 4), 4);
    assert.equal(payments.getPaymentQuantityForLinks( 5), 5);

    assert.equal(payments.getPaymentQuantityForLinks(24), 24);
    assert.equal(payments.getPaymentQuantityForLinks(25), 25);
    assert.equal(payments.getPaymentQuantityForLinks(26), 26);
  });
});
