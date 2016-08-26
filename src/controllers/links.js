export function index(Link, req, res) {
  return Link.find({}).exec((err, links) => {
    if (err) {
      console.trace(err);
      return res.status(500).send({error: 'Database error.'});
    }

    let lastId = links.length > 0 ? links.slice(-1)[0]._id : null
    res.status(200).send({
      data: links.map(link => {
        return {_id: link._id, name: link.name, enabled: link.enabled};
      }),
      lastId,
    });
  });
  // res.status(403).send({error: 'Not authenticated.'});
}

export function get(Link, req, res) {
  return Link.findOne({_id: req.params.id}).exec((err, link) => {
    if (err) {
      console.trace(err);
      return res.status(500).send({error: 'Database error.'});
    }

    res.status(200).send(link);
  });
}

export function create(Link, req, res) {
  if (req.isAuthenticated()) {
    let link = new Link({enabled: false, user: req.user, to: null, false: null});
    link.save(err => {
      if (err) {
        console.trace(err);
        return res.status(500).send({error: 'Database error.'});
      }

      res.status(201).send(link.format());
    })
  } else {
    res.status(403).send({error: 'Not authenticated'});
  }
}





function formatLink(data) {
  delete data._id;
  return data;
}

export function update(Link, req, res) {
  if (req.isAuthenticated()) {
    let link = formatLink(req.body.link);

    Link.update({_id: req.params.linkId}, link).exec((err, data) => {
      if (err) {
        console.trace(err);
        return res.status(500).send({error: 'Database error.'});
      }

      res.status(200).send({status: 'ok'});
    });
  } else {
    res.status(403).send({error: 'Not authenticated'});
  }
}

export function enable(Link, req, res) {
  if (!req.isAuthenticated()) {
    res.status(403).send({error: 'Not authenticated'});
  } else if (typeof req.body.enabled !== 'boolean') {
    res.status(500).send({error: 'Enabled property not specified in the body.'});
  } else {
    Link.update({_id: req.params.linkId}, {enabled: req.body.enabled}).exec((err, data) => {
      if (err) {
        console.trace(err);
        return res.status(500).send({error: 'Database error.'});
      }

      res.status(200).send({status: 'ok'});
    });
  }
}
