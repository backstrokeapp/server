export function index(Link, req, res) {
  if (req.isAuthenticated()) {
    return Link.find({user: req.user}).exec((err, links) => {
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
  } else {
    res.status(403).send({error: 'Not authenticated.'});
  }
}

export function get(Link, req, res) {
  if (req.isAuthenticated()) {
    return Link.findOne({user: req.user, _id: req.params.id}).exec((err, link) => {
      if (err) {
        console.trace(err);
        return res.status(500).send({error: 'Database error.'});
      }

      res.status(200).send(link);
    });
  } else {
    res.status(500).send({error: 'Database error.'});
  }
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

export function update(Link, req, res) {
  if (req.isAuthenticated()) {
    Link.update({_id: req.params.linkId, user: req.user}, req.body).exec((err, data) => {
      if (err) {
        console.trace(err);
        return res.status(500).send({error: 'Database error.'});
      }

      res.status(200).send({status: 'ok'});
    });
  }
}
