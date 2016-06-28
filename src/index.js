import express from 'express';
let app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

// parse body of incoming requests
import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

import {webhook} from './remote';

// add a repo to the system
app.get("/", (req, res) => {
  res.render("index");
});
app.route("/new").post((req, res) => {
  res.render("finish", {data: req.body});
});

// the webhook route
app.route("/ping/github/:user/:repo").get((req, res) => {
  res.redirect(`https://github.com/${req.params.user}/${req.params.repo}`);
}).post(webhook);

let port = process.env.PORT || 8000;
app.listen(port);
console.log("Listening on port", port, "...");
