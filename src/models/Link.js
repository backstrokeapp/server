import mongoose from 'mongoose';

export default function Link(schema) {
  const Link = schema.define('Link', {
    name: String,
    enabled: Boolean,
    hookId: String, // comma-delimited array of hooks
    owner: schema.models.User,

    upstream: schema.models.Repository,
    fork: schema.models.Repository,
    allForks: Boolean,
    hookKey: String,
  });

  // Link.belongsTo(schema.models.Repository, {as: 'upstream'});
  // Link.belongsTo(schema.models.Repository, {as: 'fork'});
  return Link;
}
