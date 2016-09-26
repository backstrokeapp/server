import Promise from 'bluebird';
import stripeFactory from 'stripe';
const PRICE_PER_HOOK = 0.02;
const stripe = stripeFactory(process.env.STRIPE_TOKEN);

import isLinkPaid from 'helpers/isLinkPaid';

// Given a number of links, return the "payment quantity" that is set within stripe.
export function getPaymentQuantityForLinks(linkCount) {
  return linkCount;
}

// Called when a paid link is added or changed
// Directly called by updatePaidLink below
export function changePaidLinkQuantity(User, user, amount) {
  if (user.customerId) {
    function createSubscription() {
      // create a subscription
      return stripe.subscriptions.create({
        customer: user.customerId,
        plan: 'premium_link',
        quantity: getPaymentQuantityForLinks(amount),
        metadata: {
          repos: amount,
        },
      }).then(subscription => {
        return User.update({_id: user._id}, {subscriptionId: subscription.id}).exec();
      });
    }

    // create or update subscription?
    return stripe.subscriptions.retrieve(user.subscriptionId).then(subsc => {
      if (subsc) {
        // update the subscription
        return stripe.subscriptions.update(user.subscriptionId, {
          quantity: getPaymentQuantityForLinks(amount),
          metadata: {
            repos: amount,
          },
        });
      } else {
        return createSubscription();
      }
    }).catch(createSubscription);
  } else {
    return Promise.reject(new Error('Payment info not specified.'));
  }
}

// A paid link is defined as:
// - A link with a private repo within.
// - A link that is also enabled.
export function updatePaidLinks(Link, User, user) {
  return Link.find({owner: user, enabled: true}).exec().then(links => {
    let paidLinks = links.map(link => isLinkPaid(user, link));

    return Promise.all(paidLinks).then(linksPaid => {
      return linksPaid.filter(f => f).length;
    }).then(linkCount => {
      if (user.customerId) {
        return changePaidLinkQuantity(User, user, linkCount);
      } else if (linkCount > 0) {
        throw new Error(`Cannot add a private repo for a user that doesn't have payment info.`);
      } else {
        return true; // No payment required.
      }
    });
  });
}


// A route to get subscription information for the logged-in user.
export function getSubscriptionInformation(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.customerId && req.user.subscriptionId) {
      return stripe.subscriptions.retrieve(req.user.subscriptionId).then(subsc => {
        res.status(200).send({
          status: 'ok',
          paymentBlockQuantity: subsc.quantity,
          paymentAmount: subsc.quantity * (subsc.plan.amount / 100),
        });
      }).catch(err => {
        res.status(500).send({error: "Server error"});
        process.env.NODE_ENV !== 'test' && (() => {throw err})();
      });
    } else if (req.user.customerId) {
      // A user isn't paying anything and doesn't have a subscription associated with their user
      res.status(200).send({
        status: 'ok',
        paymentBlockQuantity: 0,
        paymentAmount: 0,
        note: 'No subscription on the authenticated user.'
      });
    } else {
      res.status(400).send({error: "No customer associated with this user."});
    }
  } else {
    res.status(403).send({error: 'Not authenticated.'});
  }
}

// Add a card to a user
export function addPaymentToUser(User, req, res) {
  if (req.isAuthenticated()) {
    if (req.body.source) {
      function createCustomer() {
        // create a customer
        return stripe.customers.create({
          source: req.body.source,
          email: req.body.email,
          metadata: {
            provider: req.user.provider,
            user: req.user.user,
          },
        }).then(customer => {
          return User.update({_id: req.user._id}, {customerId: customer.id}).exec();
        });
      }

      // create or update subscription?
      return stripe.customers.retrieve(req.user.customerId).then(customer => {
        if (customer) {
          // update the customer
          return stripe.customers.update(req.user.customerId, {
            source: req.body.source,
            email: req.body.email,
            metadata: {
              provider: req.user.provider,
              user: req.user.user,
            },
          });
        } else {
          return createCustomer();
        }
      }).catch(createCustomer).then(() => {
        res.status(200).send({status: 'ok'});
      }).catch(error => {
        if (error.message.indexOf('You cannot use a Stripe token more than once') === 0) {
          res.status(400).send({error: `You can't reuse payment source tokens!`});
        } else {
          return Promise.reject(error);
        }
      });
    } else {
      return Promise.reject(new Error('Payment source not provided in body.'));
    }
  } else {
    res.status(403).send({error: 'Not authenticated.'});
  }
}
