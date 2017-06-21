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
