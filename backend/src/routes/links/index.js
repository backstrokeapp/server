import uuid from 'uuid';
import {PAGE_SIZE, paginate} from '../helpers';
import {removeOldWebhooksForLink} from './addWebhooksForLink';

import Debug from 'debug';
const updateDebug = Debug('backstroke:links:update');

// Return all links in a condensed format. Included is {_id, name, paid, enabled}.
// This will support pagination.
export function index(req, res, Link) {
  return Link.all({
    where: {ownerId: req.user.id},
    ...paginate(req),
  }).then(data => {
    // Add all owners to each link
    return Promise.all(data.map(i => i.display())).then(display => {
      return {
        page: req.query.page || 0,
        data: display,
        lastItem: paginate(req).skip + data.length,
      };
    });
  });
}

// Return one single link in full, expanded format.
// This will support pagination.
export function get(req, res, Link) {
  return Link.findOne({where: {id: req.params.id, ownerId: req.user.id}}).then(link => {
    if (link) {
      return link.display();
    } else {
      throw new Error('No such link.');
    }
  });
}

// Create a new Link. This new link is disabled and is really just a
// placeholder for an update later on.
// This will support pagination.
export function create(req, res, Link) {
  return Link.create({
    enabled: false,
    ownerId: req.user.id,
  });
}


// Update a Link. This method requires a body with a link property.
// Responds with {"status": "ok"} on success.
export function update(req, res, Link, Repository, addWebhooksForLink, removeOldWebhooksForLink) {
  if (!(req.body && req.body.link)) {
    throw new Error('No link field in json body.');
  }

  let {id, ...link} = req.body.link;

  if (!(link.upstream && link.fork)) {
    throw new Error('Please specify an upstream and fork.');
  }

  if (link.upstream && link.upstream.type === 'fork-all') {
    throw new Error(`The 'upstream' repo must be a repo, not a bunch of forks.`);
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
          return addWebhooksForLink(req, linkModel);
        }).then(hookId => {
          return linkModel.updateAttribute('hookId', hookId);
        });
      });
    } else {
      throw new Error('No such link with that id.');
    }
  });
}

// Enable or disable a link. Requires a body like {"enabled": true/false}, and
// responds with {"status": "ok"}
export function enable(req, res, Link) {
  if (typeof req.body.enabled !== 'boolean') {
    throw new Error('Enabled property not specified in the body.');
  } 

  return Link.findOne({
    where: {id: req.params.linkId, ownerId: req.user.id},
  }).then(link => {
    if (link) {
      return link.updateAttribute('enabled', req.body.enabled);
    } else {
      throw new Error('No link found with the given id that is owned by you.');
    }
  }).then(() => {
    res.status(200).send({status: 'ok'});
  });
}

// Delete a link. Returns a 204 on success, or a 404 / 500 on error.
export function del(req, res, Link) {
  return Link.findOne({where: {id: req.params.id, ownerId: req.user.id}}).then(link => {
    if (link) {
      return removeOldWebhooksForLink(req.user, link).then(() => {
        return link.destroy();
      }).then(() => link.display());
    } else {
      throw new Error('No such link.');
    }
  });
}
