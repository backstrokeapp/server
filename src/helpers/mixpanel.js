import Mixpanel from 'mixpanel';

const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;
let mixpanel = null;
if (MIXPANEL_TOKEN) {
  mixpanel = Mixpanel.init(MIXPANEL_TOKEN, {protocol: 'https'});
}

export default function analyticsForRoute(req, res, next) {
  // If mixpanel token is set, tell mixpanel when a request is made.
  if (MIXPANEL_TOKEN && req.user) {
    mixpanel.people.set(req.user.id, {
      $first_name: req.user.username,
      email: req.user.email,
      scope: req.user.publicScope ? 'public' : 'private',
    });

    mixpanel.track('Visited Route', {
      distinct_id: req.user.id,
      url: req.url,
      method: req.method,
      request: req.headers['x-request-id'],
    });
  }

  next();
}
