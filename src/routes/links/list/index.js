import {PAGE_SIZE, paginate} from '../../helpers';

// Return a list of all links that belong to the logged in user.
// This route is paginated.
export default function index(req, res, Link) {
  return Link.all({
    where: {ownerId: req.user.id},
    ...paginate(req),
  }).then(data => {
    // Add all owners to each link
    return Promise.all(data.map(i => i.display())).then(data => {
      return {
        page: parseInt(req.query.page, 10) || 0,
        pageSize: PAGE_SIZE,
        data,
      };
    });
  });
}
