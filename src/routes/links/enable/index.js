import Debug from 'debug';
const debug = Debug('backstroke:links:get');

// Enable or disable a link. Requires a body like {"enabled": true/false}, and
// responds with {"status": "ok"}
export default async function enable(req, res, Link) {
  if (typeof req.body.enabled !== 'boolean') {
    throw new Error('Enabled property not specified in the body.');
  } 

  const link = await Link.findById(req.params.linkId)

  // Link not owned by user.
  if (link && link.ownerId !== req.user.id) {
    debug('Link %o not owned by %o', link.id, req.user.id);
    throw new Error('No such link.');

  // Link not valid.
  } else if (link && (!link.upstreamType || !link.forkType)) {
    throw new Error('Please update the link with a valid upstream and fork before enabling.');

  // Link is valid!
  } else if (link) {
    await Link.update({enabled: req.body.enabled}, {where: {id: link.id}});
    return {status: 'ok'};

  // Link does not exist.
  } else {
    throw new Error('No such link.');
  }
}
