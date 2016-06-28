Backstroke
===
Keep projects forks up to date to make merging simple.

## Here's how it works:
1. You push code to Github.
2. Backstroke will create a pull request with any unmerged upstream changes.
3. You accept the pull request, and have updated code. Merging your code back upstream later on is painless.

### Setup:
1. Fork an existing repository.
2. Create a webhook in the fork (`Settings` => `Webhooks & Services` => `Add Webhook`)
3. Input `http://backstroke.us/ping/github` as the payload url.
4. Create the webhook, and push some code to see Backstroke in action.

### FAQ
- Why isn't Backstroke working?

Take a look at the webhook response logs. Most likely, you'll see a self-explanitory error. Otherwise, open an issue.

- Is Backstroke really all that useful?

If you never merge upstream, then no, not really. Otherwise, if you hate
resolving merge conflicts, then it's great.
