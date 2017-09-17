import Debug from 'debug';
const debug = Debug('backstroke:links:update');

// Update a Link. This method requires a body with a link property.
// Responds with {"status": "ok"} on success.
export default async function update(req, res, Link, isCollaboratorOfRepository) {
  // Ensure req.body is an object (ie, {})
  if (Object.prototype.toString.call(req.body) !== '[object Object]') {
    res.status(400).send({error: 'Invalid json body.'});
  }

  if (!req.body.upstream) {
    res.status(400).send({error: `Link doesn't have an 'upstream' key.`});
  }
  if (!req.body.fork) {
    res.status(400).send({error: `Link doesn't have a 'fork' key.`});
  }

  if (req.body.upstream && req.body.upstream.type === 'fork-all') {
    res.status(400).send({error: `The 'upstream' repo must be a repo, not a bunch of forks.`});
  }

  if (!Array.isArray(req.body.upstream.branches)) {
    res.status(400).send({error: `The upstream wasn't passed an array of branches.`});
  }

  if (req.body.upstream.type === 'repo' && !Array.isArray(req.body.upstream.branches)) {
    res.status(400).send({error: `An array of branches wasn't passed to the upstream.`});
  }

  if (req.body.fork.type === 'repo' && !Array.isArray(req.body.fork.branches)) {
    res.status(400).send({error: `An array of branches wasn't passed to the fork.`});
  } else if (req.body.fork.type === 'fork-all') {
    // A link of type fork-all doesn't have any branches.
    req.body.fork.branches = [];
  }

  // Make sure that the user has permission to create this link.
  // 1. If the fork.type == 'repo', then make sure the user has permission to write to the fork repository.
  // 2. If the fork.type == 'fork-all', then make sure the user has permission to the upstream.
  if (req.body.fork.type === 'fork-all') {
    const isCollaborator = await isCollaboratorOfRepository(req.user, req.body.upstream);
    if (!isCollaborator) {
      debug('WITHIN LINK %o, CHECKING ON UPSTREAM, USER IS NOT COLLABORATOR', req.params.linkId);
      res.status(400).send({error: `To update a link that syncs changes from the upstream ${req.body.upstream.owner}/${req.body.upstream.repo} to all fork, you need to be a collaborator on ${req.body.upstream.owner}/${req.body.upstream.repo}. Instead, sync to a single fork that you own instead of all forks.`});
      return
    }
  } else {
    const isCollaborator = await isCollaboratorOfRepository(req.user, req.body.fork);
    if (!isCollaborator) {
      debug('WITHIN LINK %o, CHECKING ON FORK, USER IS NOT COLLABORATOR', req.params.linkId);
      res.status(400).send({error: `You need to be a collaborator of ${req.body.fork.owner}/${req.body.fork.repo} to sync changes to that fork.`});
      return
    }
  }
  debug('USER HAS PERMISSION TO CREATE/UPDATE LINK %o', req.params.linkId);

  // Execute the update.
  const response = await Link.update({
    name: req.body.name,
    enabled: req.body.enabled,

    upstreamType: req.body.upstream.type,
    upstreamOwner: req.body.upstream.owner,
    upstreamRepo: req.body.upstream.repo,
    upstreamIsFork: req.body.upstream.isFork,
    upstreamBranches: JSON.stringify(req.body.upstream.branches),
    upstreamBranch: req.body.upstream.branch,

    forkType: req.body.fork.type,
    forkOwner: req.body.fork.owner,
    forkRepo: req.body.fork.repo,
    forkBranches: JSON.stringify(req.body.fork.branches),
    forkBranch: req.body.fork.branch,
  }, {
    where: {
      id: req.params.linkId,
      ownerId: req.user.id,
    },
    limit: 1,
  });

  // Verify the update was successful.
  if (response[0] > 0) {
    debug('UPDATED LINK ID %o', req.params.linkId);
    const updated = await Link.findById(req.params.linkId);
    return updated.display();
  } else {
    res.status(404).send({error: 'No such link found that is owned by this account.'});
  }
}
