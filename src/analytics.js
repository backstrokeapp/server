import Mixpanel from 'mixpanel';
let mixpanel;
if (process.env.USE_MIXPANEL) {
  mixpanel = Mixpanel.init(process.env.USE_MIXPANEL);
}

export function trackWebhook(link) {
  process.env.USE_MIXPANEL && mixpanel.track('Webhook', {
    "Link Id": link._id,
    "From Repo Name": link.upstream ? link.upstream.name : null,
    "From Repo Provider": link.upstream ? link.upstream.provider : null,
    "To Repo Name": link.fork ? (link.fork.name || link.fork.type) : null,
    "To Repo Provider": link.fork ? link.fork.provider : null,
  });
}
