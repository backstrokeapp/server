import Debug from 'debug';
const debug = Debug('backstroke:links:get');

// Return one single link in full, expanded format.
export default function get(req, res, Link) {
  return Link.find(req.params.id).then(link => {
    if (link && link.ownerId !== req.user.id) {
      debug('LINK %o NOT OWNED BY %o', link.id, req.user.id);
      throw new Error('No such link.');
    } else if (link) {
      return link.display();
    } else {
      throw new Error('No such link.');
    }
  });
}
