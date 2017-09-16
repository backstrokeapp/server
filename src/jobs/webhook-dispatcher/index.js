import {literal} from 'sequelize';
import Debug from 'debug';
const debug = Debug('backstroke:webhook:job');

const AUTOMATIC = 'AUTOMATIC';
const UPDATE_SECONDS = 30;
const WEBHOOK_SYNC_DURATION = '10 minutes';

// Every 30 seconds, try to update a link.
export default function(Link, User, WebhookQueue, upstreamSHAChanged) {
  webhookJob.apply(null, arguments);
  return setInterval(() => webhookJob.apply(null, arguments), UPDATE_SECONDS * 1000);
}

export async function webhookJob(Link, User, WebhookQueue, fetchSHAForUpstreamBranch) {
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
    const headSha = await fetchSHAForUpstreamBranch(link).catch(err => {
      console.warn(`Warning: ${err.message}`);
    });

    // Before enqueuing an update, make sure that the commit hash actually changed of the upstream
    debug(`Updating link %o, last updated = %o, last known SHA = %o, current SHA = %o`, link.id, link.lastSyncedAt, link.upstreamLastSHA, headSha);
    if (headSha !== false) {
      if (!link.upstreamLastSHA || link.upstreamLastSHA !== headSha) {
        await WebhookQueue.push({type: AUTOMATIC, user: link.owner, link});
        debug(`Update enqueued successfully for link %o.`, link.id);
      } else {
        debug(`Link didn't change, update not required.`);
      }
    } else {
      debug(`Upstream repository within link %o doesn't exist.`, link.id)
    }

    // Update the link instance to say that the link has been synced (or, at least checked)
    await Link.update({lastSyncedAt: new Date, upstreamLastSHA: headSha}, {where: {id: link.id}, limit: 1});
  });

  return Promise.all(responses).catch(err => {
    console.error('Error in syncing job:', err);
  });
}
