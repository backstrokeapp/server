import webhook from 'webhook/';
import createGithubInstance from '../createGithubInstance';

export default function webhookRoute(Link, req, res) {
  let gh = createGithubInstance(req.user);
  return Link.findOne({_id: req.params.linkId}).exec().then(link => {
    return webhook(gh, link);
  }).then(output => {
    res.status(201).send({status: 'ok', output});
  }).catch(err => {
    console.trace(err);
    res.status(500).send({error: 'Server error.'});
  });
}
