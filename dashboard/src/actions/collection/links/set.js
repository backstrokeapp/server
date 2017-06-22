export const COLLECTION_LINKS_SET = 'COLLECTION_LINKS_SET';

export default function collectionLinksSet(data, page) {
  return { type: COLLECTION_LINKS_SET, data, page };
}
