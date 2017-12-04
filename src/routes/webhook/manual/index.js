import Debug from 'debug';
const debug = Debug('backstroke:webhook:manual');

const MANUAL = 'MANUAL';
const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 8000}`;

export default async function webhook(req, res, Link, User, WebhookQueue) {
  // Note: it is purposeful we are not filtering by user below, since this endpoint is
  // unathenticated.
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

      // Link a manual link in the queue back to the request that spawned it.
      fromRequest: req.headers['x-request-id'] || null,
    });

    res.status(201).send({
      message: 'Scheduled webhook.',
      enqueuedAs,
      statusUrl: `${API_URL}/v1/operations/${enqueuedAs}`,
    });
  } else if (link) {
    res.status(400).send({error: `Link is not enabled!`});
  } else {
    res.status(404).send({error: `No such link with the id ${req.params.linkId}`});
  }
}
