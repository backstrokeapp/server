export default function whoami(req, res) {
  if (req.isAuthenticated()) {
    res.status(200).send(
			Object.assign({}, req.user._doc, {accessToken: undefined, refreshToken: undefined})
		);
  } else {
    res.status(400).send({error: 'Not logged in.'});
  }
}

export function whoamiMock(req, res) {
  res.status(200).json({
		_id: "57c022f7e9a9470e3b32a057",
		provider_id: "1704236",
		user: "1egoman",
		provider: "github",
		picture: "https://avatars.githubusercontent.com/u/1704236?v=3",
		email: null,
		__v: 0,
  });
}
