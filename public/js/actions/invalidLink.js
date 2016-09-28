export default function invalidLink(how) {
  return {
    type: 'ACTIVE_LINK_INVALID',
    how,
  };
}
