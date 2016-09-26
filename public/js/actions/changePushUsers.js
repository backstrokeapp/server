export default function changePushUsers(users) {
  if (typeof users === 'string') {
    users = users.split(/[ ,;](?!$)/g).filter(u => u.length > 0);
  }

  return {type: 'CHANGE_PUSH_USERS', users};
}
