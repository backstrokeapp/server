import uuid from 'uuid';
import {PAGE_SIZE, paginate, internalServerErrorOnError} from '../helpers/controllerHelpers';
import {removeOldWebhooksForLink} from '../helpers/addWebhooksForLink';

import Debug from 'debug';
const updateDebug = Debug('backstroke:links:update');

// Return all links in a condensed format. Included is {_id, name, paid, enabled}.
// This will support pagination.
export function index(Link, req, res) {
  return Link.all({
    where: {ownerId: req.user.id},
    ...paginate(req),
  }).then(data => {
    // Add all owners to each link
    return Promise.all(data.map(i => i.display())).then(display => {
      return res.status(200).send({
        data: display,
        lastItem: paginate(req).skip + data.length,
      });
    });
  }).catch(internalServerErrorOnError(res));
}

// Return one single link in full, expanded format.
// This will support pagination.
export function get(Link, req, res) {
  return Link.findOne({where: {id: req.params.id, ownerId: req.user.id}}).then(link => {
    if (link) {
      return link.display().then(display => {
        res.status(200).send(display);
      });
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
    ownerId: req.user.id,
  };

  return Link.create(link).then(link => {
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

  function updateRepositoryOnLink(repoId, newRepoData) {
    delete newRepoData.id; // Make sure the user doesn't try to forcefully update the id
    return Repository.findOne({where: {id: repoId}}).then(repo => {
      if (repo) {
        return repo.updateAttributes(newRepoData);
      } else {
        return Repository.create(newRepoData);
      }
    });
  }

  return Link.findOne({
    where: {id: req.params.linkId, ownerId: req.user.id},
  }).then(linkModel => {
    updateDebug('OLD LINK MODEL %o AND NEW LINK UPDATES %o', linkModel, link);

    if (linkModel) {
      return Promise.all([
        updateRepositoryOnLink(linkModel.upstreamId, link.upstream),
        updateRepositoryOnLink(linkModel.forkId, link.fork),
      ]).then(repositoryUpdateResponse => {
        link.upstreamId = repositoryUpdateResponse[0].id;
        link.forkId = repositoryUpdateResponse[1].id;

        return removeOldWebhooksForLink(req.user, linkModel).then(() => {
          return linkModel.updateAttributes(link);
        }).then(linkModel => {
          return addWebhooksForLink(req.user, linkModel);
        }).then(hookId => {
          return linkModel.updateAttribute('hookId', hookId);
        });
      }).then(data => {
        res.status(200).send(data);
      });
    } else {
      return res.status(404).send({error: 'No such link with that id.'});
    }
  }).catch(internalServerErrorOnError(res));
}

// Enable or disable a link. Requires a body like {"enabled": true/false}, and
// responds with {"status": "ok"}
export function enable(Link, req, res) {
  if (typeof req.body.enabled !== 'boolean') {
    return res.status(400).send({error: 'Enabled property not specified in the body.'});
  } 

  Link.findOne({
    where: {id: req.params.linkId, ownerId: req.user.id},
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
  return Link.findOne({where: {id: req.params.id, ownerId: req.user.id}}).then(link => {
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
