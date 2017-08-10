import Debug from 'debug';
const debug = Debug('backstroke:links:update');

// Update a Link. This method requires a body with a link property.
// Responds with {"status": "ok"} on success.
export default async function update(req, res, Link) {
  // Ensure req.body is an object (ie, {})
  if (Object.prototype.toString.call(req.body) !== '[object Object]') {
    throw new Error('Invalid json body.');
  }

  if (!req.body.upstream) {
    throw new Error(`Link doesn't have an 'upstream' key.`);
  }
  if (!req.body.fork) {
    throw new Error(`Link doesn't have a 'fork' key.`);
  }

  if (req.body.upstream && req.body.upstream.type === 'fork-all') {
    throw new Error(`The 'upstream' repo must be a repo, not a bunch of forks.`);
  }

  if (!Array.isArray(req.body.upstream.branches)) {
    throw new Error(`The upstream wasn't passed an array of branches.`);
  }

  if (req.body.upstream.type === 'repo' && !Array.isArray(req.body.upstream.branches)) {
    throw new Error(`An array of branches wasn't passed to the upstream.`);
  }

  if (req.body.fork.type === 'repo' && !Array.isArray(req.body.fork.branches)) {
    throw new Error(`An array of branches wasn't passed to the fork.`);
  } else if (req.body.fork.type === 'fork-all') {
    // A link of type fork-all doesn't have any branches.
    req.body.fork.branches = [];
  }

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
