import mongoose from 'mongoose';

export default function Link(schema) {
  const Link = schema.define('Link', {
    name: String,
    enabled: Boolean,
    hook_id: String,
    owner: schema.models.User,

    /* upstream */
    /* fork */
    allForks: Boolean,
  });

  Link.belongsTo(schema.models.Repository, {as: 'upstream'});
  Link.belongsTo(schema.models.Repository, {as: 'fork'});

  return Link;
}
