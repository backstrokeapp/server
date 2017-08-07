import repl from 'repl';
import debug from 'debug';
import uuid from 'uuid';
import fetch from 'node-fetch';

import {Schema} from 'jugglingdb';

const schema = new Schema('postgres', {
  username: 'postgres',
  password: 'mysecretpassword', 
  database: 'backstroke',
  host: process.env.DATABASE_HOST || 'localhost', 
  port: 5432, 
  debug: true,
  // ssl: true, 
});




export const User = schema.define('User', {
  username: String,
  email: String,
  githubId: String,
  accessToken: String,
  publicScope: Boolean, // Did the user register with the `public` scope (only providing access to open source repos)?

  createdAt: { type: Date, default: () => new Date },
  lastLoggedInAt: { type: Date, default: () => new Date },
});

User.validatesPresenceOf('username', 'githubId', 'accessToken');
User.validatesUniquenessOf('username', {message: 'Username is not unique'});

// Create a new user in the registration function
User.register = async function register(profile, accessToken) {
  const logger = debug('backstroke:user:register');

  // Does the user already exist?
  const model = await User.findOne({where: {githubId: profile.id.toString()}});

  // What permissions was the given token given?
  let permissions = [];
  const scopes = (await fetch('https://api.github.com/users/backstroke-bot', {
    headers: {
      'Authorization': `token ${accessToken}`,
    },
  })).headers.get('x-oauth-scopes');
  if (scopes && scopes.length > 0) {
    permissions = scopes.split(',').map(i => i.trim());
  }

  // Did the user only give us access to public repos?
  const publicScope = permissions.indexOf('public_repo') >= 0;

  // If so, then just update the user model with the new info.
  if (model) {
    logger(
      'UPDATING USER MODEL %o WITH %o, username = %o, email = %o, publicScope = %o',
      model,
      profile.id,
      profile.username,
      profile.email,
      publicScope,
    );
    return model.updateAttributes({
      username: profile.username,
      email: profile._json.email,
      githubId: profile.id,
      accessToken,
      publicScope,

      lastLoggedInAt: new Date,
    });
  } else {
    logger('CREATE USER %o', profile.username);
    return this.create({
      username: profile.username,
      email: profile._json.email,
      githubId: profile.id,
      accessToken,
      publicScope,

      lastLoggedInAt: new Date,
    });
  }
}





export const Link = schema.define('Link', {
  name: String,
  enabled: Boolean,

  webhookId: { type: String, default: () => uuid.v4().replace(/-/g, '') },

  upstreamType: {type: String, enum: ['repo', 'all-forks']},
  upstreamOwner: String,
  upstreamRepo: String,
  upstreamIsFork: Boolean,
  upstreamBranches: Schema.JSON,
  upstreamBranch: String,

  forkType: {type: String, enum: ['repo', 'all-forks']},
  forkOwner: String,
  forkRepo: String,
  forkBranches: Schema.JSON,
  forkBranch: String,
});

// A link has a foreign key to a user.
Link.belongsTo(schema.models.User, {as: 'owner', foreignKey: 'ownerId'});

// Link.validatesInclusionOf('forkType', {in: ['repo', 'all-forks']});
// Link.validatesInclusionOf('upstreamType', {in: ['repo', 'all-forks']});

// The update method takes the nested format (with upstream / fork) as sub-objects.
Link.updateRaw = Link.update
Link.prototype.update = async function update(data) {
  if (!data.upstream) {
    throw new Error(`Link doesn't have an 'upstream' key.`);
  }
  if (!data.fork) {
    throw new Error(`Link doesn't have an 'fork' key.`);
  }

  return this.updateAttributes({
    name: data.name,
    enabled: data.enabled,

    upstreamType: data.upstream.type,
    upstreamOwner: data.upstream.owner,
    upstreamRepo: data.upstream.repo,
    upstreamIsFork: data.upstream.fork,
    upstreamBranches: data.upstream.branches,
    upstreamBranch: data.upstream.branch,

    forkType: data.fork.type,
    forkOwner: data.fork.owner,
    forkRepo: data.fork.repo,
    forkBranches: data.fork.branches,
    forkBranch: data.fork.branch,
  });
}

// Convert a link to its owtward-facing structure. Expand all foreign keys and
// remove sensitive data.
Link.prototype.display = function display() {
  return {
    id: this.id,
    name: this.name,
    enabled: this.enabled,

    fork: this.fork(),
    upstream: this.upstream(),
  };
}

Link.prototype.fork = function fork() {
  if (this.forkType === 'fork-all') {
    return {type: 'fork-all'};
  } else {
    return {
      type: this.forkType,
      owner: this.forkOwner,
      repo: this.forkRepo,
      isFork: true,
      branches: this.forkBranches,
      branch: this.forkBranch,
    };
  }
}

Link.prototype.upstream = function upstream() {
  return {
    type: this.upstreamType,
    owner: this.upstreamOwner,
    repo: this.upstreamRepo,
    isFork: this.upstreamFork,
    branches: this.upstreamBranches,
    branch: this.upstreamBranch,
  };
}

if (require.main === module) {
  if (process.argv[2] === 'migrate') {
    console.log('Migrating schema...');
    schema.automigrate();
    console.log('Done.');
  } else if (process.argv[2] === 'shell') {
    const options = {
      useColors: true,
      useGlobal: true,
    };
    const context = {
      schema,
      Link,
      User,
    };

    // From https://stackoverflow.com/questions/33673999/passing-context-to-interactive-node-shell-leads-to-typeerror-sandbox-argument
    Object.assign(repl.start(options).context, context);
  }
}
