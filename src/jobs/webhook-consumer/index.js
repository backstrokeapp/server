import {literal} from 'sequelize';
import Debug from 'debug';
const debug = Debug('backstroke:webhook:consumer');


import RedisMQ from 'rsmq';
const redis = require('redis').createClient(process.env.REDIS_URL);
const redisQueue = new RedisMQ({
  client: redis,
  ns: 'rsmq',
});

const OK = 'OK', RUNNING = 'RUNNING', ERROR = 'ERROR';
const ONE_HOUR_IN_SECONDS = 60 * 60;

// Logging function to use in webhooks.
function logger() { console.log.apply(console, ['   *', ...arguments]); }

// The batch processing function. Eats off the queue and publishes results to redis.
export async function processBatch(WebhookQueue, WebhookStatusStore) {
  while (true) {
    // Fetch a new webhook event.
    const webhook = await WebhookQueue.pop();
    // The queue is empty? Cool, we're done.
    if (!webhook) { break; }

    // Let redis know that we are starting to process this webhook.
    const startedAt = (new Date()).toISOString();
    await WebhookStatusStore.set(webhook.id, {
      status: RUNNING,
      startedAt,
    });

    // Extract a number of helpful values for use in the below code.
    const link = webhook.data.link;
    const user = webhook.data.user;

    // Log the type of update that is happening.
    console.log(`=> * Handling webhook ${webhook.id}:`);
    logger(`From: ${link.upstreamOwner}/${link.upstreamRepo}@${link.upstreamBranch}`);
    if (link.forkType === 'fork-all') {
      logger(`To: all forks @ ${link.upstreamBranch} (uses upstream branch)`);
    } else {
      logger(`To: ${link.forkOwner}/${link.forkRepo}@${link.forkBranch}`);
    }

    /* TODO: do the thing! :) */
    const output = {foo: 'bar'};

    // Successful! Update redis to say so.
    await WebhookStatusStore.set(webhook.id, {
      status: OK,
      startedAt,
      finishedAt: (new Date()).toISOString(),
      output,
    });
  }
}

export default function(WebhookQueue, WebhookStatusStore) {
  // Every once and a while, process a new batch of webhook events
  const UPDATE_SECONDS = 30;
  processBatch(WebhookQueue, WebhookStatusStore).then(() => {
    setInterval(() => processBatch(WebhookQueue, WebhookStatusStore), UPDATE_SECONDS * 1000);
  });
}
