// Return one single link in full, expanded format.
export default function get(req, res, Link) {
  return Link.findOne({
    where: {id: req.params.id, ownerId: req.user.id},
  }).then(link => {
    if (link) {
      return link.display();
    } else {
      throw new Error('No such link.');
    }
  });
}
