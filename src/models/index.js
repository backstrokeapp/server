import repl from 'repl';
import debug from 'debug';
import uuid from 'uuid';
import fetch from 'node-fetch';

import Redis from 'redis';
const redis = Redis.createClient(process.env.REDIS_URL);
import RedisMQ from 'rsmq';
const redisQueue = new RedisMQ({
  client: redis,
  ns: 'rsmq',
});

const ONE_HOUR_IN_SECONDS = 60 * 60;
const LINK_OPERATION_EXPIRY_TIME_IN_SECONDS = 24 * ONE_HOUR_IN_SECONDS;
export const WebhookStatusStore = {
  set(webhookId, status, expiresIn=LINK_OPERATION_EXPIRY_TIME_IN_SECONDS) {
    return new Promise((resolve, reject) => {
      redis.set(`webhook:status:${webhookId}`, JSON.stringify(status), 'EX', expiresIn, (err, id) => {
        if (err) {
          reject(err);
        } else {
          // Resolves the message id.
          resolve(id);
        }
      });
    });
  },
  get(webhookId, hideSensitiveKeys=true) {
    return new Promise((resolve, reject) => {
      redis.get(`webhook:status:${webhookId}`, (err, data) => {
        if (err) {
          reject(err);
        } else {
          // Resolves the cached data.
          const parsed = JSON.parse(data);
          if (hideSensitiveKeys) {
            if (parsed) {
              // Remove access token from response.
              resolve({
                ...parsed,
                link: {
                  ...(parsed.link || {}),
                  owner: {
                    ...(parsed.link ? parsed.link.owner : {}),
                    accessToken: undefined,
                  },
                },
              });
            } else {
              // No operation id was found
              return null;
            }
          } else {
            resolve(parsed);
          }
        }
      });
    });
  },
  getOperations(linkId) {
    return new Promise((resolve, reject) => {
      // Get unix epoch timestamp in seconds.
      // FIXME: should use redis time. We're not accounting for any sort of server time drift here.
      const timestamp = Math.floor(new Date().getTime() / 1000);

      // Return all operations associated with a given link that have happened in the last 24 hours.
      redis.zrangebyscore(
        `webhook:operations:${linkId}`,
        timestamp - LINK_OPERATION_EXPIRY_TIME_IN_SECONDS,
        timestamp,
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        }
      );
    });
  },
};

export const WebhookQueue = {
  queueName: process.env.REDIS_QUEUE_NAME || 'webhookQueue',
  initialize() {
    return new Promise((resolve, reject) => {
      redisQueue.createQueue({qname: this.queueName}, (err, resp) => {
        if (err && err.name === 'queueExists') {
          // Queue was already created.
          resolve();
        } else if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  },
  push(data) {
    return new Promise((resolve, reject) => {
      redisQueue.sendMessage({qname: this.queueName, message: JSON.stringify(data)}, (err, id) => {
        if (err) {
          reject(err);
        } else {
          // Resolves the message id.
          resolve(id);
        }
      });
    });
  },
  pop() {
    return new Promise((resolve, reject) => {
      redisQueue.popMessage({qname: this.queueName}, (err, data) => {
        if (err) {
          reject(err);
        } else if (!data || typeof data.id === 'undefined') {
          // No items in the queue
          resolve(null);
        } else {
          // Item was found on the end of the queue!
          resolve({data: JSON.parse(data.message), id: data.id});
        }
      });
    });
  }
};
WebhookQueue.initialize();




import Sequelize from 'sequelize';
const schema = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.DATABASE_REQUIRE_SSL.toLowerCase() === 'true' ? true : false,
  },
});





import userConstructor from './user';
export const User = userConstructor(schema);



import linkConstructor from './link';
export const Link = linkConstructor(schema);

if (require.main === module) {
  if (process.argv[2] === 'migrate') {
    console.log('Migrating schema...');
    Link.sync({alter: true});
    User.sync({alter: true});
    console.log('Done.');
  } else if (process.argv[2] === 'shell') {
    const options = {
      useColors: true,
      useGlobal: true,
    };
    const context = {
      redis,
      schema,
      Link,
      User,
      WebhookQueue,
      WebhookStatusStore,
    };

    // From https://stackoverflow.com/questions/33673999/passing-context-to-interactive-node-shell-leads-to-typeerror-sandbox-argument
    Object.assign(repl.start(options).context, context);
  }
}
