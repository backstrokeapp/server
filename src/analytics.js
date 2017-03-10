import Mixpanel from 'mixpanel';
let mixpanel;
if (process.env.USE_MIXPANEL) {
  mixpanel = Mixpanel.init(process.env.USE_MIXPANEL);
}

export function trackWebhook(link) {
  process.env.USE_MIXPANEL && mixpanel.track('Webhook', {
    "Link Id": link._id,
    "From Repo Name": link.from ? link.from.name : null,
    "From Repo Provider": link.from ? link.from.provider : null,
    "To Repo Name": link.to ? (link.to.name || link.to.type) : null,
    "To Repo Provider": link.to ? link.to.provider : null,
  });
}
