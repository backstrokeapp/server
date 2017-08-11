# Webhook Job

This job is used to push automatic updates to the queue. Every 30 seconds, the database is queried
to see if there are any links that were last updated over 10 minutes ago. If so, an `AUTOMATIC`
update is pushed to the queue and the link is updated to make the last updated field the current
date. This has the effect of pushing a queue update every 10 minutes for each link.

## Future improvements
- Store the latest ref for the branch, only push an update if the ref is different.
- Tune the times a bit more, currently just guesses.
