// Enable or disable a link. Requires a body like {"enabled": true/false}, and
// responds with {"status": "ok"}
export default function enable(req, res, Link) {
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
    return {status: 'ok'};
  });
}

