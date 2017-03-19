const PAGE_SIZE = 20;

function paginate(req) {
  let page = req.query.page || 0;
  return {skip: page * PAGE_SIZE, limit: PAGE_SIZE};
}

// Something bad happened. Throw a 500.
function internalServerErrorOnError(res) {
  return error => {
    res.status(500);
    // res.headers['Content-Type'] = 'text/plain';
    res.send(error.toString());
  };
}

// Return all links in a condensed format. Included is {_id, name, paid, enabled}.
// This will support pagination.
export function index(Link, req, res) {
  return Link.all({
    where: {owner: req.user},
    ...paginate(req),
  }).then(data => {
    res.status(200).send({
      data,
      lastItem: paginate(req).skip + data.length,
    });
  }).catch(internalServerErrorOnError(res));
}

// Return one single link in full, expanded format.
// This will support pagination.
export function get(Link, req, res) {
  return Link.findOne({where: {id: req.params.id, owner: req.user}}).then(link => {
    if (link) {
      res.status(200).send(link);
    } else {
      res.status(404).send({error: "No such link."});
    }
  });
}

// Create a new Link. This new link is disabled and is really just a
// placeholder for an update later on.
// This will support pagination.
export function create(Link, req, res) {
  let link = {
    enabled: false,
    owner: req.user,
  };

  Link.create(link).then(link => {
    res.status(201).send(link);
  }).catch(internalServerErrorOnError(res));
}


// Update a Link. This method requires a body with a link property.
// Responds with {"status": "ok"} on success.
export function update(Link, Repository, addWebhooksForLink, removeOldWebhooksForLink, req, res) {
  if (!req.body || !req.body.link) {
    return res.status(400).send({error: 'No link field in json body.'});
  }

  let {id, ...link} = req.body.link;

  if (!(upstream && fork)) {
    return res.status(400).send({error: 'Please specify and upstream and fork.'});
  }

  if (upstream && upstream.type === 'fork-all') {
    return res.status(400).send({error: `The 'upstream' repo must be a repo, not a bunch of forks.`});
  }

  Link.findOne({where: {id: req.params.linkId}}).then(referenceLink => {
    if (!referenceLink) {
      return res.status(404).send({error: 'No such link with that id.'});
    }

    return referenceLink.updateAttributes(link);

    // // First, save the upstream and fork.
    // return Promise.all([
    //   Repository.updateOrCreate(upstream),
    //   Repository.updateOrCreate(fork),
    // ]).then(([upstream, fork]) => {
    //   // Link up the foreign keys and then save the link.
    //   link.upstreamId = upstream.id;
    //   link.forkId = fork.id;
    // });
  }).then(data => {
    res.status(200).send(data);
  }).catch(internalServerErrorOnError(res));



  return;


  // remove a link's id when updating, if it exists
  link.id = req.params.linkId;

  // Remove any existing webhooks on the old repository
  return Link.findOne({
    where: {id: req.params.linkId, owner: req.user},
  }).then(oldLink => {
    // return removeOldWebhooksForLink(req.user, oldLink);

  // Add webhooks to the link in the provider
  }).then(() => {
    // return addWebhooksForLink(req.user, link)
    return false;
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
    console.log('LINK', link);
    return Link.update(link);
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
