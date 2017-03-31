import webhook from '../webhook';
import createGithubInstance from '../createGithubInstance';
import {NoSuchLinkError} from 'helpers/errors';
import {internalServerErrorOnError} from '../helpers/controllerHelpers';

export default function webhookRoute(Link, webhook, req, res) {
  return Link.findOne({
    where: {id: req.params.linkId},
  }).then(link => {
    if (link) {
      return link.owner().then(owner => {
        const gh = createGithubInstance(owner);
        return webhook(gh, link);
      });
    } else {
      res.status(404).send(`No such link with the id ${req.params.linkId}`);
    }
  }).then(output => {
    if (output.isEnabled === false) {
      res.status(200).send({
        enabled: false,
        status: 'not-enabled',
        msg: `The link isn't enabled.`,
      });
    } else {
      res.status(201).send({status: 'ok', output});
    }
  }).catch(internalServerErrorOnError(res));
}
