import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import request from 'request';

// A helper to mount a given route to a mock express app and query the endpoint, mainly useful for
// testing.
//
// function myRoute(Dependency, req, res) {
//   res.send('foo');
// }
//
// issueRequest(
//    myRoute,         // The route to substitute in

//    [Dependency],    // A list of dependencies to inject prior to the route.

//    '/',             // Where to mount the route at. This is an option because you may want to
//                     // mount at something other than '/', ie, you need request an id passed in
//                     // via `req.params` and that requires the url to be `/:id`.

//    null,            // A user object to be put into req.user. `null` signifies no authed user.

//    {                // Finally, custom parameters to make the request with, like headers, body, etc
//      method: 'GET',
//      url: '/',
//    }
// ).then(res => {
//   // `res` is a response from the `request` package, and has fields like `res.statusCode`
//   // and `res.body`.
// });
export default function issueRequest(fn, deps, mountAt='/', user=null, requestParameters={url: '/'}) {
  return new Promise((resolve, reject) => {
    // Create a unix socket to mount the server at
    const socketPath = path.join(process.cwd(), `backstroke-test-socket-${process.pid}.sock`);
    if (fs.existsSync(socketPath)) {
      fs.unlinkSync(socketPath);
    }

    // Create a server with the function mounted at `/`
    let app = express();
    app.use(bodyParser.json());
    app.use((req, res, next) => {
      req.user = user;
      req.isAuthenticated = () => req.user ? true : false;
      next();
    });
    app.all(mountAt, (req, res) => fn.apply(null, [...deps, req, res]));

    // Listen on a local socket
    app.listen(socketPath, () => {
      requestParameters = Object.assign({}, requestParameters, {
        url: `http://unix:${socketPath}:${requestParameters.url}`,
      });
      return request(requestParameters, (err, resp) => {
        // After making the request, delete the socket.
        fs.unlinkSync(socketPath);

        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  });
}
