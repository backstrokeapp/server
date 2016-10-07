export default function addAllForks(slot) {
  if (slot === 'to') {
    return {
      type: 'ADD_ALL_FORKS',
      slot,
    };
  }
}
