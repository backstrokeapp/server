export default function whoami(req, res) {
  if (req.isAuthenticated()) {
    res.status(200).send(req.user);
  } else {
    res.status(401).send({error: 'Not logged in.'});
  }
}
