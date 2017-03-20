import uuid from 'uuid';
import {PAGE_SIZE, paginate, internalServerErrorOnError} from '../helpers/controllerHelpers';
import {removeOldWebhooksForLink} from '../helpers/addWebhooksForLink';

// Return all links in a condensed format. Included is {_id, name, paid, enabled}.
// This will support pagination.
export function index(Link, req, res) {
  return Link.all({
    where: {owner: req.user},
    ...paginate(req),
  }).then(data => {
    res.status(200).send({
      data,//: data.map(i => ({...i, hookId: i.hookId.split(',')})),
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
    upstream: {branches: []},
    fork: {branches: []},
    hookKey: uuid.v4().replace(/-/g, ''), // A random secret to use in the webhook
  };

  Link.create(link).then(link => {
    res.status(201).send(link);
  }).catch(internalServerErrorOnError(res));
}


// Update a Link. This method requires a body with a link property.
// Responds with {"status": "ok"} on success.
export function update(Link, Repository, addWebhooksForLink, removeOldWebhooksForLink, req, res) {
  if (!(req.body && req.body.link)) {
    return res.status(400).send({error: 'No link field in json body.'});
  }

  let {id, ...link} = req.body.link;

  if (!(link.upstream && link.fork)) {
    return res.status(400).send({error: 'Please specify and upstream and fork.'});
  }

  if (link.upstream && link.upstream.type === 'fork-all') {
    return res.status(400).send({error: `The 'upstream' repo must be a repo, not a bunch of forks.`});
  }

  return Link.findOne({
    where: {id: req.params.linkId, owner: req.user},
  }).then(linkModel => {
    if (linkModel) {
      return removeOldWebhooksForLink(req.user, linkModel).then(() => {
        return linkModel.updateAttributes(link);
      }).then(() => {
        return addWebhooksForLink(req.user, link);
      }).then(hookId => {
        console.log('HOOK ID', hookId);
        return linkModel.updateAttribute('hookId', hookId.join(','));
      });
    } else {
      return res.status(404).send({error: 'No such link with that id.'});
    }
  }).then(data => {
    res.status(200).send(data);
  }).catch(internalServerErrorOnError(res));
}

// Enable or disable a link. Requires a body like {"enabled": true/false}, and
// responds with {"status": "ok"}
export function enable(Link, req, res) {
  if (typeof req.body.enabled !== 'boolean') {
    return res.status(400).send({error: 'Enabled property not specified in the body.'});
  } 

  Link.findOne({
    where: {id: req.params.linkId, owner: req.user},
  }).then(link => {
    if (link) {
      return link.updateAttribute('enabled', req.body.enabled);
    } else {
      res.status(400).send({status: 'not-complete'});
    }
  }).then(() => {
    res.status(200).send({status: 'ok'});
  }).catch(internalServerErrorOnError(res));
}

// Delete a link. Returns a 204 on success, or a 404 / 500 on error.
export function del(Link, req, res) {
  return Link.findOne({where: {id: req.params.id, owner: req.user}}).then(link => {
    if (link) {
      return removeOldWebhooksForLink(req.user, link).then(() => {
        return link.destroy();
      });
    } else {
      return res.status(404).send({error: "No such item."});
    }
  }).then(() => {
    res.status(204).end();
  }).catch(internalServerErrorOnError(res));
}
