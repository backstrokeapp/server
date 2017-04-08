export default function addAllForks(slot) {
  if (slot === 'fork') {
    return {
      type: 'ADD_ALL_FORKS',
      slot,
    };
  }
}
