import {literal} from 'sequelize';
import Debug from 'debug';
const debug = Debug('backstroke:webhook:job');

const AUTOMATIC = 'AUTOMATIC';
const UPDATE_SECONDS = 30;
const WEBHOOK_SYNC_DURATION = '10 minutes';

// Every 30 seconds, try to update a link.
export default function(Link, User, WebhookQueue) {
  return setInterval(() => webhookJob.apply(null, arguments), UPDATE_SECONDS * 1000);
}

export async function webhookJob(Link, User, WebhookQueue) {
  const links = await Link.findAll({
    where: {
      name: {ne: ''},
      enabled: true,
      lastSyncedAt: {
        lt: literal(`now() - interval '${WEBHOOK_SYNC_DURATION}'`),
      },

      upstreamType: {ne: null},
      upstreamOwner: {ne: null},
      upstreamRepo: {ne: null},

      forkType: {ne: null},
      forkOwner: {ne: null},
      forkRepo: {ne: null},
    },
    include: [{model: User, as: 'owner'}],
  });

  // No links to update?
  if (!links || links.length === 0) {
    return null;
  }

  const responses = links.map(async link => {
    debug(`Updating link %o, last updated %o`, link.id, link.lastSyncedAt);
    const enqueuedAs = await WebhookQueue.push({
      type: AUTOMATIC,
      user: link.owner,
      link,
    });

    debug(`Update successful for link %o.`, link.id);
    await Link.update({lastSyncedAt: new Date}, {where: {id: link.id}, limit: 1});
  });

  return Promise.all(responses).catch(err => {
    console.error('Error in syncing job:', err);
  });
}
