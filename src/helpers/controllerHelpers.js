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
    throw error;
  };
}

// Given a method and arguments, issue a request until all possible data items come through.
export function paginateRequest(method, args, pageSize=100, page=0, cumulativeData=[]) {
  // Add a page size to the request.
  if (!Array.isArray(args)) {
    args = [args];
  }
  args[0].page = page;
  args[0].per_page = pageSize;

  return method.apply(null, args).then(data => {
    if (data.length === pageSize) {
      // Data is still coming, go for another round.
      cumulativeData = [...cumulativeData, ...data];
      return paginateRequest(method, args, pageSize, ++page, cumulativeData);
    } else if (data.length < pageSize) {
      // Fewer resuts returned than expected, so we know this is the last page.
      cumulativeData = [...cumulativeData, ...data];
      return cumulativeData;
    } else {
      // NOTE: this case should never happen, where more results are returned then expected.
      return cumulativeData;
    }
  });
}
