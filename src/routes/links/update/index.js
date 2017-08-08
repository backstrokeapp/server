import Debug from 'debug';
const debug = Debug('backstroke:links:update');

// Update a Link. This method requires a body with a link property.
// Responds with {"status": "ok"} on success.
export default function update(req, res, Link) {
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


  const {id, ...link} = req.body;

  return Link.find(req.params.linkId).then(async model => {
    if (!model) {
      throw new Error('No such link with that id.');
    } else if (model.ownerId !== req.user.id) {
      debug('LINK %o NOT OWNED BY %o', model.id, req.user.id);
      throw new Error('No such link with that id.');
    } else {
      debug('OLD LINK MODEL %o AND NEW LINK UPDATES %o', model, link);

      return model.updateAttributes({
        name: req.body.name,
        enabled: req.body.enabled,

        upstreamType: req.body.upstream.type,
        upstreamOwner: req.body.upstream.owner,
        upstreamRepo: req.body.upstream.repo,
        upstreamIsFork: req.body.upstream.isFork,
        upstreamBranches: req.body.upstream.branches,
        upstreamBranch: req.body.upstream.branch,

        forkType: req.body.fork.type,
        forkOwner: req.body.fork.owner,
        forkRepo: req.body.fork.repo,
        forkBranches: req.body.fork.branches,
        forkBranch: req.body.fork.branch,
      }).then(i => i.display());
    }
  });
}
