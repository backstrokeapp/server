# Subcommands

- `yarn test`: Run all tests interactively with jest.
- `yarn coverage`: Get coverage statistics with jest.
- `yarn migrate`: Perform a database migration to get the database tables into the expected state
  given the state of the models.
- `yarn shell`: Opens a REPL with a number of helpful utilities, including:
  - `redis` is an instance of node-redis that is connected to the redis instance used by the server
    and worker.
  - `Link` is an instance of the `Link` model that is attached to the database. Useful for performing
    database operations on links.
  - `User` is an instance of the `User` model that is attached to the database. Useful for performing
    database operations on links.
  - `WebhookQueue` is an object containing `.push(item)` and `.pop()` functions used to add or
    remove items from the queue.
  - `WebhookStatusStore` is an object containing `.set(id, data)` and `.get(id)` functions used to
    get the status of a webhook operation given its id.
- `yarn manual-job`: Manually issue the webhook job. Primarily used if working on the webhook job
  and one wants to run the job over and over.
