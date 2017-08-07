import Debug from 'debug';
const updateDebug = Debug('backstroke:links:update');

// Update a Link. This method requires a body with a link property.
// Responds with {"status": "ok"} on success.
export default function update(req, res, Link, Repository, addWebhooksForLink, removeOldWebhooksForLink) {
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

  return Link.find(req.params.linkId).then(model => {
    if (!model) {
      throw new Error('No such link with that id.');
    } else if (model.ownerId !== req.user.id) {
      throw new Error(`Link is not owned by you.`);
    } else {
      updateDebug('OLD LINK MODEL %o AND NEW LINK UPDATES %o', model, link);
      return model.update(link).then(l => l.display());
    }
  });
}
