import webhook from 'webhook/';
import createGithubInstance from '../createGithubInstance';
import {NoSuchLinkError} from 'helpers/errors';

export default function webhookRoute(Link, req, res) {
  return Link.findOne({_id: req.params.linkId}).populate('owner').exec().then(link => {
    if (link) {
      let gh = createGithubInstance(link.owner);
      return webhook(gh, link);
    } else {
      throw new NoSuchLinkError(`No such link with the id ${req.params.linkId}`);
    }
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
  }).catch(NoSuchLinkError, err => {
    res.status(400).send({error: err.message});
  }).catch(err => {
    res.status(500).send({error: err});
    throw err;
  });
}
