import Debug from 'debug';
const debug = Debug('backstroke:links:get');

// Enable or disable a link. Requires a body like {"enabled": true/false}, and
// responds with {"status": "ok"}
export default async function enable(req, res, Link) {
  if (typeof req.body.enabled !== 'boolean') {
    throw new Error('Enabled property not specified in the body.');
  } 

  const link = await Link.findById(req.params.linkId)
  if (link && link.ownerId !== req.user.id) {
    debug('Link %o not owned by %o', link.id, req.user.id);
    throw new Error('No such link.');
  } else if (link) {
    await Link.update({enabled: req.body.enabled}, {where: {id: link.id}});
    return {status: 'ok'};
  } else {
    throw new Error('No such link.');
  }
}
