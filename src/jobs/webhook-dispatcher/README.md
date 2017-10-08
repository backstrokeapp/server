# Webhook Dispatcher Job

This job is used to push automatic updates to the queue. Every 30 seconds, the database is queried
to see if there are any links that were last updated over 10 minutes ago. If so, an `AUTOMATIC`
update is pushed to the queue and the link is updated to make the last updated field the current
date. This has the effect of pushing a queue update every 10 minutes for each link.

## Disambiguation

Backstroke runs the auto syncing process on links every 10 minutes. When it's your link's turn,
here's what happens:
1. Within the database, each link stores the latest SHA of the upstream end of the link.
2. Github is queried to get the SHA at the head of the branch of the upstream that is being synced
from; in the above example, `upstream/foo`'s `master` branch would be fetched.
3. If the stored SHA and the fetched SHA differ, then dispatch a new link update into the queue.
4. Update the stored SHA in the database that is associated with the link to be the fetched SHA.

For example, let's say we have two repositories, `upstream/foo`, and `fork/foo`. As the names
suggest, `fork/foo` is a fork of `upstream/foo`. Backstroke is configured to keep these two
repositories in sync on the `master` branches of both repositories:

```
In Database:
upstream/foo    master = 39ef1a

On Github:

 +-----------------------------------+
 |                                   |
 | upstream/foo    master = 78bb0b6  |
 |                                   |
 +-----------------------------------+
                  ||
                  ||
                 \  /
                  \/
 +-----------------------------------+
 |                                   |
 |   fork/foo      master = 75c2be84 |
 |                                   |
 +-----------------------------------+
```

In the above example, the automatic linking process would create a pull request on `fork/foo`, since
the database's representation of `upstream/foo` differs from the actual representation of
`upstream/foo`. Afterwards, this would be the state of the system:

```
In Database:
upstream/foo    master = 78bb0b6

On Github:

 +-----------------------------------+
 |                                   |
 | upstream/foo    master = 78bb0b6  |
 |                                   |
 +-----------------------------------+
                  ||
                  ||
                 \  /
                  \/
 +-----------------------------------+
 |                                   |
 |   fork/foo      master = 75c2be84 |  <- There's an open pull request to bring master up to 78bb0b6!
 |                                   |
 +-----------------------------------+
```
