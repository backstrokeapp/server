import Debug from 'debug';
const debug = Debug('backstroke:links:get');

// Enable or disable a link. Requires a body like {"enabled": true/false}, and
// responds with {"status": "ok"}
export default function enable(req, res, Link) {
  if (typeof req.body.enabled !== 'boolean') {
    throw new Error('Enabled property not specified in the body.');
  } 

  return Link.find(req.params.linkId).then(link => {
    if (link && link.ownerId !== req.user.id) {
      debug('Link %o not owned by %o', link.id, req.user.id);
      throw new Error('No such link.');
    } else if (link) {
      return link.updateAttribute('enabled', req.body.enabled).then(() => {
        return {status: 'ok'};
      });
    } else {
      throw new Error('No such link.');
    }
  });
}
