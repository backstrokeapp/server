// Create a new Link. This new link is disabled and is really just a
// placeholder for an update later on.
export default function create(req, res, Link) {
  return Link.create({
    name: '',
    enabled: false,
    ownerId: req.user.id,
  });
}
