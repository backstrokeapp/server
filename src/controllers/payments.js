import stripeFactory from 'stripe';
const PRICE_PER_HOOK = 0.02;
const stripe = stripeFactory(process.env.STRIPE_TOKEN);

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
export function addPaidLink(user, delta=1) {
  if (user.customerId) {
    // create or update subscription?
    return stripe.subscriptions.retreive(user.subscriptionId).then(subsc => {
      if (subsc) {
        // update the subscription
        subsc.quantity += delta;
        return stripe.subscriptions.update(user.subscriptionId, {quantity: subs.quantity});
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
    return Promise.reject(new Error('Peyment info not specified.'));
  }
}
