import {PAGE_SIZE, paginate} from '../helpers';

// Return all links in a condensed format. Included is {_id, name, paid, enabled}.
// This will support pagination.
export default function index(req, res, Link) {
  return Link.all({
    where: {ownerId: req.user.id},
    ...paginate(req),
  }).then(data => {
    // Add all owners to each link
    return Promise.all(data.map(i => i.display())).then(display => {
      return {
        page: req.query.page || 0,
        data: display,
        lastItem: paginate(req).skip + data.length,
      };
    });
  });
}
