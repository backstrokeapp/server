import Debug from 'debug';
const debug = Debug('backstroke:webhook:status');

const MANUAL = 'MANUAL';

export default async function webhook(req, res, WebhookStatus) {
  const response = await WebhookStatus.get(req.params.operationId);

  if (response) {
    return response;
  } else {
    res.status(403).send({
      error: 'No such webhook operation was found with that id.',
      note: 'Your operation has either not started yet or is old and has been removed to free space.',
    });
  }
}
