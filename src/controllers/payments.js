import stripeFactory from 'stripe';
const PRICE_PER_HOOK = 0.02;
const stripe = stripeFactory(process.env.STRIPE_TOKEN);

export function createCustomer(user, token) {
  let customer;
  return stripe.customers.create({
    source: token,
    description: `${user.provider}:${user.user}`, // the user's github username
  }).then(cust => {
    customer = cust;
    return stripe.subscriptions.create({
      customer: customer.id,
      plan: 'private_repo',
    });
  }).then(subscription => {
    return {
      subscription,
      customer,
    };
  });
}

export function addPrivateRepo(user) {
  return stripe.subscriptions.retreive(user.subscriptionId).then(subsc => {
    return stripe.subscriptions.update(user.subscriptionId, {quantity: ++subsc.quantity});
  });
}


export function addPaymentInfo(User, req, res) {
  if (req.isAuthenticated()) {
    return createCustomer(req.user, req.body.stripeToken).then(data => {
      return User.update({_id: req.user._id}, {
        customerId: data.customer.id,
        subscriptionId: data.subscription.id
      });
    }).then(user => {
      res.status(200).send({status: 'ok'});
    }).catch(err => {
      res.status(500).send({error: 'Payment error.'});
    })
  } else {
    res.status(403).send({error: 'Not authenticated.'});
  }
}
