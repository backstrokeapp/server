import {Schema} from 'jugglingdb';

export default function Link(schema) {
  const Link = schema.define('Link', {
    name: String,
    enabled: Boolean,
    hookId: Schema.JSON, // array of string hook ids
    // owner: schema.models.User,

    upstream: schema.models.Repository,
    fork: schema.models.Repository,
    allForks: Boolean,
  });

  Link.belongsTo(schema.models.User, {as: 'owner'});

  return Link;
}
