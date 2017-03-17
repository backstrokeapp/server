import {PremiumRequiresPaymentError} from 'helpers/errors';

// Return all links in a condensed format. Included is {_id, name, paid, enabled}.
// This will support pagination.
export function index(Link, req, res) {
  return Link.all({where: {owner: req.user}}).then(data => {
    // calculate the last id so more pages can be fetched.
    let lastId = data.length > 0 ? data.slice(-1)[0]._id : null;
    res.status(200).send({data, lastId});
  }).catch(error => {
    return res.status(500).send({error});
  });
}

// Return one single link in full, expanded format.
// This will support pagination.
export function get(Link, req, res) {
  return Link.findOne({_id: req.params.id, owner: req.user}).exec((err, link) => {
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
  let link = new Link({enabled: false, owner: req.user, to: null, from: null});
  link.save(err => {
    if (err) {
      process.env.NODE_ENV !== 'test' && console.trace(err);
      return res.status(500).send({error: 'Database error.'});
    }

    res.status(201).send(link.toObject());
  });
}



// Update a Link. This method requires a body with a link property.
// Responds with {"status": "ok"} on success.
export function update(Link, User, addWebhooksForLink, removeOldWebhooksForLink, req, res) {
  if (!req.body || !req.body.link) {
    return res.status(400).send({error: 'No link field in json body.'});
  }

  let link = req.body.link;

  // make sure `to` is a fork
  if (req.body && req.body.link && req.body.link.to && req.body.link.to.fork === false) {
    return res.status(400).send({error: `The 'to' repo must be a fork.`});
  }

  // remove a link's id when updating, if it exists
  link._id = req.params.linkId;

  // Remove any existing webhooks on the old repository
  return Link.findOne({_id: req.params.linkId, owner: req.user}).exec()
  .then(oldLink => {
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

    // update the link
    return Link.update({_id: req.params.linkId, owner: user}, link).exec();
  }).then(() => {
    res.status(200).send({status: 'ok'});
  }).catch(err => {
    if (err.name === 'CastError') {
      res.status(400).send(err);
    } else {
      res.status(500).send({error: "Server error", err});
      process.env.NODE_ENV !== 'test' && (() => {throw err})()
    }
  });
}

// Enable or disable a link. Requires a body like {"enabled": true/false}, and
// responds with {"status": "ok"}
export function enable(Link, User, req, res) {
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
        res.status(200).send({status: 'ok'});
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

export function del(Link, User, req, res) {
  let user = assertLoggedIn(req, res);

  if (!req.isAuthenticated()) {
    return
  } else {
    Link.remove({_id: req.params.id, owner: user}).exec()
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
