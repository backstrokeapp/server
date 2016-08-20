import express from 'express';
let app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// the old webhook route
// app.route("/ping/github/:user/:repo").get((req, res) => {
//   res.redirect(`https://github.com/${req.params.user}/${req.params.repo}`);
// }).post(webhook);

// the webhook route
// app.route("/").get((req, res) => {
//   res.redirect(`https://github.com/1egoman/backstroke`);
// }).post(webhook);

let port = process.env.PORT || 8000;
app.listen(port);
console.log("Listening on port", port, "...");
