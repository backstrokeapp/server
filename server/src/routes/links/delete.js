// Delete a link. Returns a 204 on success, or a 404 / 500 on error.
export default function del(req, res, Link, removeOldWebhooksForLink) {
  return Link.findOne({where: {id: req.params.id, ownerId: req.user.id}}).then(link => {
    if (link) {
      return removeOldWebhooksForLink(req.user, link).then(() => {
        return link.destroy();
      }).then(() => link.display());
    } else {
      throw new Error('No such link.');
    }
  });
}
