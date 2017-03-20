// A bunch of helpers that are used in controllers.
//
// Default page size.
export const PAGE_SIZE = 20;

// A helper to paginate queries.
// Use like:
// Model.all({...paginate(req)}).then(data => ...);
export function paginate(req) {
  let page = req.query.page || 0;
  return {skip: page * PAGE_SIZE, limit: PAGE_SIZE};
}

// Something bad happened. Throw a 500.
export function internalServerErrorOnError(res) {
  return error => {
    res.status(500);
    // res.headers['Content-Type'] = 'text/plain';
    res.send(error.toString());
  };
}

