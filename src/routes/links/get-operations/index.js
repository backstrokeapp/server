import Debug from 'debug';
const debug = Debug('backstroke:links:getOperations');

// Return all link operations that are associated with a given link.
export default async function getOperations(req, res, Link, WebhookStatusStore) {
  const link = await Link.findById(req.params.id);

  if (link && link.ownerId !== req.user.id) {
    debug('LINK %o NOT OWNED BY %o', link.id, req.user.id);
    throw new Error('No such link.');
  } else if (link) {
    // Fetch all operations associated with a link.
    const operations = await WebhookStatusStore.getOperations(link.id);

    // Allow passing an optional ?detail=true query param to lookup each operation.
    if (req.query.detail && req.query.detail.toLowerCase() === 'true') {
      // Lookup each operation in parallel, and return them.
      const statuses = await Promise.all(operations.map(op => WebhookStatusStore.get(op)));
      // Add an id back to each response
      return statuses.map((status, index) => Object.assign({id: operations[index]}, status));
    }

    // Otherwise, return just hte operation ids.
    return operations;
  } else {
    throw new Error('No such link.');
  }
}
