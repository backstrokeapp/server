import Debug from 'debug';
const debug = Debug('backstroke:links:delete');

// Delete a link. Returns a 204 on success, or a 404 / 500 on error.
export default async function del(req, res, Link) {
  const numRemoved = await Link.destroy({
    where: {
      id: req.params.id,
      ownerId: req.user.id,
    },
    limit: 1,
  });

  if (numRemoved > 0) {
    res.status(204).end();
    return null;
  } else {
    res.status(404).send({
      error: 'No such link found that is owned by this account.',
    });
  }
}
