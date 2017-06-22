export const COLLECTION_LINKS_ERROR = 'COLLECTION_LINKS_ERROR';

export default function collectionLinksError(error) {
  return { type: COLLECTION_LINKS_ERROR, error };
}
