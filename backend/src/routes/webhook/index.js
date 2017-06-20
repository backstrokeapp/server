import webhookHandler from './handler';

export default function webhook(req, res, Link) {
  return Link.findOne({
    where: {id: req.params.linkId},
  }).then(link => {
    if (link) {
      return link.owner().then(owner => {
        // Use the owner of the link to make all queries.
        const github = new GitHubApi({});
        github.authenticate({
          type: 'oauth',
          token: owner.accessToken,
        });
        req.github.user = constructor(github);

        return webhookHandler(req, link);
      });
    } else {
      throw new Error(`No such link with the id ${req.params.linkId}`);
    }
  }).then(output => {
    if (output.isEnabled === false) {
      return {
        enabled: false,
        status: 'not-enabled',
        msg: `The link isn't enabled.`,
      }
    } else {
      return {status: 'ok', output};
    }
  });
}
