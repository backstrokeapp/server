import Debug from 'debug';
const debug = Debug('backstroke:links:delete');

// Delete a link. Returns a 204 on success, or a 404 / 500 on error.
export default function del(req, res, Link, removeOldWebhooksForLink) {
  return Link.find(req.params.id).then(link => {
    if (link && link.ownerId !== req.user.id) {
      debug('Link %o not owned by %o', link.id, req.user.id);
      throw new Error('No such link.');
    } else if (link) {
      return link.destroy();
    } else {
      throw new Error('No such link.');
    }
  });
}
