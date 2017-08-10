import webhookHandler from './handler';
const MANUAL = 'MANUAL';

export default async function webhook(req, res, Link, User, WebhookQueue) {
  const link = await Link.findOne({
    where: {webhookId: req.params.linkId},
    include: [{model: User, as: 'owner'}],
  });

  // If the webhook is enabled, add it to the queue.
  if (link && link.enabled) {
    const enqueuedAs = await WebhookQueue.push({
      type: MANUAL,
      user: link.owner,
      link,
    });

    res.status(201).send({
      message: 'Scheduled webhook.',
      enqueuedAs,
    });
  } else if (link) {
    throw new Error(`Link is not enabled!`);
  } else {
    throw new Error(`No such link with the id ${req.params.linkId}`);
  }
}
