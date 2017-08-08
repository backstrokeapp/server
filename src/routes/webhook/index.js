import webhookHandler from './handler';
const MANUAL = 'MANUAL';

export default async function webhook(req, res, Link, WebhookQueue) {
  const link = await Link.findOne({where: {webhookId: req.params.linkId}});
  if (link) {
    const user = await link.owner();
    const enqueuedAs = await WebhookQueue.push({
      type: MANUAL,
      user,
      link,
    });

    res.status(201).send({
      message: 'Scheduled webhook.',
      enqueuedAs,
    });
  } else {
    throw new Error(`No such link with the id ${req.params.linkId}`);
  }
}
