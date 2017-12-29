import Sequelize from 'sequelize';
import uuid from 'uuid';

module.exports = schema => {
  const Link = schema.define('link', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },

    webhookId: { type: Sequelize.STRING, defaultValue: () => uuid.v4().replace(/-/g, '') },

    lastSyncedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW},

    upstreamType: {type: Sequelize.ENUM, values: ['repo']},
    upstreamOwner: Sequelize.STRING,
    upstreamRepo: Sequelize.STRING,
    upstreamIsFork: Sequelize.BOOLEAN,
    upstreamBranches: Sequelize.TEXT,
    upstreamBranch: Sequelize.STRING,
    // Store the last known SHA for the commit at the HEAD of the `upstreamBranch` branch.
    upstreamLastSHA: Sequelize.STRING,

    forkType: {type: Sequelize.ENUM, values: ['repo', 'fork-all']},
    forkOwner: Sequelize.STRING,
    forkRepo: Sequelize.STRING,
    forkBranches: Sequelize.TEXT,
    forkBranch: Sequelize.STRING,
  });

  // A link has a foreign key to a user.
  Link.belongsTo(schema.models.user, {as: 'owner', foreignKey: 'ownerId'});

  // Convert a link to its owtward-facing structure. Expand all foreign keys and
  // remove sensitive data.
  Link.prototype.display = function display() {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      webhook: this.webhookId,

      createdAt: this.createdAt,
      lastSyncedAt: this.lastSyncedAt,

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
        branches: this.forkBranches ? JSON.parse(this.forkBranches) : [],
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
      branches: this.upstreamBranches ? JSON.parse(this.upstreamBranches) : [],
      branch: this.upstreamBranch,
    };
  }


  return Link;
}
