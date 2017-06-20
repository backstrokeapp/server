// Given a route handler:
// - If the handler resolves a response, then send the response.
// - If the handler throws, then catch and send the error.
export default function routeWrapper(handler, dependencies) {
  return (req, res) => {
    return handler(req, res, ...dependencies).then(data => {
      res.status(200).send(data);
    }).catch(error => {
      res.status(400);
      // res.headers['Content-Type'] = 'text/plain';
      res.send(error.stack);
      throw error;
    });
  };
}
