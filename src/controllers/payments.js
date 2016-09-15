import Promise from 'bluebird';
import stripeFactory from 'stripe';
const PRICE_PER_HOOK = 0.02;
const stripe = stripeFactory(process.env.STRIPE_TOKEN);

import isLinkPaid from 'helpers/isLinkPaid';

// Add card info to a user.
export function addPaymentInfo(User, req, res) {
  if (req.isAuthenticated()) {
    return createCustomer(req.user, req.body.stripeToken).then(data => {
      return User.update({_id: req.user._id}, {
        customerId: data.customer.id,
        subscriptionId: data.subscription.id
      }).exec();
    }).then(user => {
      res.status(200).send({status: 'ok'});
    }).catch(err => {
      res.status(500).send({error: 'Payment error.'});
    })
  } else {
    res.status(403).send({error: 'Not authenticated.'});
  }
}

// Called when a paid link is added or changed
export function changePaidLinkQuantity(user, amount) {
  if (user.customerId) {
    // create or update subscription?
    return stripe.subscriptions.retrieve(user.subscriptionId).then(subsc => {
      if (subsc) {
        // update the subscription
        return stripe.subscriptions.update(user.subscriptionId, {quantity: amount});
      } else {
        // create a subscription
        return stripe.subscriptions.create({
          customer: user.customerId,
          plan: 'private_repo',
          quantity: delta, // 0 + delta
        });
      }
    });
  } else {
    return Promise.reject(new Error('Payment info not specified.'));
  }
}

// A paid link is defined as:
// - A link with a private repo within.
// - A link that is also enabled.
export function updatePaidLinks(Link, user) {
  return Link.find({owner: user, enabled: true}).exec().then(links => {
    let paidLinks = links.map(link => isLinkPaid(user, link));

    return Promise.all(paidLinks).then(linksPaid => {
      return linksPaid.filter(f => f).length;
    }).then(linkCount => {
      return changePaidLinkQuantity(user, linkCount);
    });
  });
}
