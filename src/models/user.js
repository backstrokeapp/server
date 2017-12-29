import Sequelize from 'sequelize';
import debug from 'debug';
import fetch from 'node-fetch';

module.exports = schema => {
  const User = schema.define('user', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    githubId: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    accessToken: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    // Did the user register with the `public` scope (only providing access to open source repos)?
    publicScope: { type: Sequelize.BOOLEAN },

    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW},
    lastLoggedInAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  });

  // Create a new user in the onboarding process.
  User.register = async function register(profile, accessToken) {
    const logger = debug('backstroke:user:register');

    // Does the user already exist?
    const model = await User.findOne({where: {githubId: profile.id.toString()}});

    // What permissions was the given token given?
    let permissions = [];
    const scopes = (await fetch(
      `https://api.github.com/users/${process.env.GITHUB_BOT_USERNAME || 'backstroke-bot'}`, {
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

      // Update the profile with the new information.
      await User.update({
        username: profile.username,
        email: profile._json.email,
        githubId: profile.id,
        accessToken,
        publicScope,

        lastLoggedInAt: new Date,
      }, {where: {id: model.id}});

      return User.findById(model.id);
    } else {
      logger('CREATE USER %o', profile.username);
      return User.create({
        username: profile.username,
        email: profile._json.email,
        githubId: profile.id,
        accessToken,
        publicScope,

        lastLoggedInAt: new Date,
      });
    }
  }

  return User;
}
