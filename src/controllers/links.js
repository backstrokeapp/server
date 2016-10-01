import {PremiumRequiresPaymentError} from 'helpers/errors';

// A utility function to check if a user is authenticated, and if so, return
// the authenticated user. Otherwise, this function will throw an error
function assertLoggedIn(req, res) {
  if (req.isAuthenticated()) {
    return req.user;
  } else {
    res.status(403).send({error: 'Not authenticated.'});
  }
}

function doPayments(Link, User, updatePaidLinks, user, res) {
  return () => {
    return updatePaidLinks(Link, User, user).catch(err => {
      if (err.message === 'Payment info not specified.') {
        return res.status(400).send({error: 'Payment info not specified.'});
      } else {
        // rethrow error
        return Promise.reject(err);
      }
    });
  };
}

// Return all links in a condensed format. Included is {_id, name, paid, enabled}.
// This will support pagination.
export function index(Link, req, res) {
  let user = assertLoggedIn(req, res);

  if (!req.isAuthenticated()) {
    return;
  }

  return Link.find({owner: user}).exec((err, links) => {
    if (err) {
      process.env.NODE_ENV !== 'test' && console.trace(err);
      return res.status(500).send({error: 'Database error.'});
    }

    // calculate metadata fields
    let lastId = links.length > 0 ? links.slice(-1)[0]._id : null
    let totalPrice = links.reduce((acc, link) => acc + Link.price(link), 0);

    res.status(200).send({
      data: links.map(link => {
        return {_id: link._id, name: link.name, enabled: link.enabled, paid: link.paid};
      }),
      lastId,
      totalPrice,
    });
  });
}

// Return one single link in full, expanded format.
// This will support pagination.
export function get(Link, req, res) {
  let user = assertLoggedIn(req, res);

  return Link.findOne({_id: req.params.id, owner: user}).exec((err, link) => {
    if (err) {
      process.env.NODE_ENV !== 'test' && console.trace(err);
      return res.status(500).send({error: 'Database error.'});
    }

    res.status(200).send(link);
  });
}

// Create a new Link. This new link is disabled and is really just a
// placeholder for an update later on.
// This will support pagination.
export function create(Link, req, res) {
  let user = assertLoggedIn(req, res);

  let link = new Link({enabled: false, owner: user, to: null, false: null});
  link.save(err => {
    if (err) {
      process.env.NODE_ENV !== 'test' && console.trace(err);
      return res.status(500).send({error: 'Database error.'});
    }

    res.status(201).send(link.format());
  });
}



// Update a Link. This method requires a body with a link property.
// Responds with {"status": "ok"} on success.
export function update(Link, User, isLinkPaid, addWebhooksForLink, removeOldWebhooksForLink, updatePaidLinks, req, res) {
  let user = assertLoggedIn(req, res);

  // Ensure the user is authenticated, and they passed a seeminly correct body.
  if (!req.isAuthenticated()) {
    return
  } else if (!req.body || !req.body.link) {
    return res.status(400).send({error: 'No link field in json body.'});
  }

  let link = req.body.link;

  // Vaidate the body against a schema
  let formatErrors = Link.isValidLink(req.body.link).errors;
  if (formatErrors.length > 0) {
    return res.status(400).send(formatErrors);
  }

  // make sure `to` is a fork
  if (req.body.link.to.fork === false) {
    return res.status(400).send({error: `The 'to' repo must be a fork.`});
  }

  // remove a link's id when updating, if it exists
  link._id = req.params.linkId;

  // Set the payment state of the link
  return isLinkPaid(req.user, link)
  .then(paid => {
    link.paid = paid;

  // Remove any existing webhooks on the old repository
  }).then(() => {
    return Link.findOne({_id: req.params.linkId, owner: user}).exec();
  }).then(oldLink => {
    return removeOldWebhooksForLink(req.user, oldLink);

  // Add webhooks to the link in the provider
  }).then(() => {
    return addWebhooksForLink(req.user, link)
  }).then(hooks => {
    if (hooks) {
      if (hooks.error) {
        return res.status(400).send({error: hooks.error});
      } else {
        // update the hook id in the hook too.
        link.hookId = hooks.id;
      }
    }

    // verify a user can create a paid link, if the link is paid
    if (link.paid && !req.user.customerId) {
      throw new PremiumRequiresPaymentError('Cannot create premium link without a payment method. Add one in `Settings`.');
    }

    // update the link
    return Link.update({_id: req.params.linkId, owner: user}, link).exec();
  }).then(doPayments(Link, User, updatePaidLinks, user, res)).then(() => {
    res.status(200).send({status: 'ok'});
  }).catch(PremiumRequiresPaymentError, err => {
    res.status(403).send({error: err.message});
  }).catch(err => {
    res.status(500).send({error: "Server error"});
    process.env.NODE_ENV !== 'test' && (() => {throw err})()
  });
}

// Enable or disable a link. Requires a body like {"enabled": true/false}, and
// responds with {"status": "ok"}
export function enable(Link, User, updatePaidLinks, req, res) {
  let user = assertLoggedIn(req, res), queryData;

  if (!req.isAuthenticated()) {
    return
  } else if (typeof req.body.enabled !== 'boolean') {
    res.status(400).send({error: 'Enabled property not specified in the body.'});
  } else {
    // step 1: verify a user can create a paid link, if the link is paid
    Link.findOne({
      _id: req.params.linkId,
      owner: user,
      paid: true,
    }).exec().then(paidLink => {
      if (paidLink && !req.user.customerId) {
        throw new PremiumRequiresPaymentError(`Cannot add a private repo for a user that doesn't have payment info`);
      }

      // step 2: update the link with the new information
      return Link.update({
        _id: req.params.linkId,
        owner: user,
        'to.type': {$exists: true},
        'from.type': {$exists: true},
        name: {$exists: true, $type: 2, $ne: ''},
      }, {
        enabled: req.body.enabled,
      }).exec()
    }).then(data => {
      queryData = data; // save this for later
    })
    // step 3: update payment status
    .then(() => {
      // step 4: return a status message
      if (queryData.nModified > 0) {
        return doPayments(Link, User, updatePaidLinks, user, res)().then(() => {
          res.status(200).send({status: 'ok'});
        });
      } else {
        res.status(400).send({status: 'not-complete'});
      }
    }).catch(PremiumRequiresPaymentError, err => {
      res.status(403).send({error: 'Cannot enable a private link without a payment method.'});
    }).catch(err => {
      process.env.NODE_ENV !== 'test' && console.trace(err);
      return res.status(500).send({error: 'Database error.'});
    });
  }
}

export function del(Link, User, updatePaidLinks, req, res) {
  let user = assertLoggedIn(req, res);

  if (!req.isAuthenticated()) {
    return
  } else {
    Link.remove({_id: req.params.id, owner: user}).exec()
    .then(doPayments(Link, User, updatePaidLinks, user, res))
    .then(() => {
      // it worked!
      res.status(200).send({status: 'ok'});
    }).catch(err => {
      console.error(err)
      process.env.NODE_ENV !== 'test' && console.trace(err);
      return res.status(500).send({error: 'Database error.'});
    });
  }
}
