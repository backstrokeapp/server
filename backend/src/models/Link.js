import Promise from 'bluebird';
import {Schema} from 'jugglingdb';

export default function Link(schema) {
  const Link = schema.define('Link', {
    name: String,
    enabled: Boolean,
    hookId: Schema.JSON, // array of string hook ids
    // owner: schema.models.User,

    // upstream: schema.models.Repository,
    // fork: schema.models.Repository,
    allForks: Boolean,
  });

  Link.belongsTo(schema.models.User, {as: 'owner'});
  Link.belongsTo(schema.models.Repository, {as: 'upstream'});
  Link.belongsTo(schema.models.Repository, {as: 'fork'});

  // Convert a link to its owtward-facing structure. Expand all foreign keys and
  // remove sensitive data.
  Link.prototype.display = function displayLink(link) {
    return Promise.props({
      ...this.toObject(),
      owner: this.owner(),
      upstream: this.upstream(),
      fork: this.fork(),

      ownerId: undefined,
      forkId: undefined,
      upstreamId: undefined,
    });
  }

  return Link;
}
