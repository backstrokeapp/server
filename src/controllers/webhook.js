import webhook from 'webhook/';
import createGithubInstance from '../createGithubInstance';

export default function webhookRoute(Link, req, res) {
  return Link.findOne({_id: req.params.linkId}).populate('owner').exec().then(link => {
    let gh = createGithubInstance(link.owner);
    return webhook(gh, link);
  }).then(output => {
    if (output.isEnabled === false) {
      res.status(200).send({
        enabled: false,
        status: 'not-enabled',
        msg: `The webhook isn't enabled.`,
      });
    } else {
      res.status(201).send({status: 'ok', output});
    }
  }).catch(err => {
    res.status(500).send({error: 'Server error.'});
    throw err;
  });
}
