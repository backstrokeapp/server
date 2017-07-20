// Given a route handler:
// - If the handler resolves a response, then send the response.
// - If the handler throws, then catch and send the error.
export default function routeWrapper(handler, dependencies) {
  function handleError(res, error) {
    res.status(400);
    res.send({error: error.message, stack: error.stack});

    // Rethrow errors so that they'll show up in the log when the server is running in dev of
    // production mode. Throwing in test mode spams the console with stack traces from testing
    // failure edge cases.
    if (process.env.NODE_ENV !== 'test') { throw error; }
  }

  return (req, res) => {
    try {
      return handler(req, res, ...dependencies).then(data => {
        res.status(200).send(data);
      }).catch(error => handleError(res, error));
    } catch (error) {
      return handleError(res, error);
    }
  };
}
