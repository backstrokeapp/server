# Contributing to Backstroke

## What is "open work"?
At http://gratipay.com/about, they have a definition:

> “Open work” means that your company or organization makes it easy for any individual to do your work for you without asking you first, and as a result to share in any revenue you generate. 

Do work first, ask permission later. Fun, isn't it? If you are opening a new issue or submitting a pull request, **go for it!** Don't be afraid that it's a dumb idea or a duplicate of another issue or an unwanted change or whatever. Maybe it is! We're still glad to have you! :^)

## How you can contribute
We're always looking for ways to make Backstroke better. Here's a few:

1. Follow along on GitHub. Looks like you're in the right place already!
2. Diagnose a bug by creating an issue
3. Suggest an improvement by creating an issue
4. Close resolved issues ([here's the big list](https://github.com/1egoman/backstroke/issues?q=is%3Aopen+is%3Aissue))
5. Fix a bug/resolve an issue
6. Write a test (or a few)
7. Add a comment to the code
8. Create an example
9. Donate on Gratipay. Servers cost money, and anything dontated will be used to keep Backstroke
   running. <https://gratipay.com/Backstroke/>

## Setting up Backstroke for development
1. First, install biome: <http://github.com/1egoman/biome>
2. Clone the repo from Github onto a local machine.
3. Open up two terminals, both `cd`ed into Backstroke's root.
4. In both terminals, run `biome`. Biome manages environment variables and this command allows you
   to enter the value of each variable Backstroke requires.
5. After entering in the required pieces of information, run `biome use` in both terminals.
6. Lastly, in one terminal, run `npm start`. In the other terminal, run `gulp`.
7. By default, Backstroke listens on port `8000`. Unless you changed that in biome, open a web
   browser to `http://localhost:8000`.
8. Backstroke's running! :tada:

### More info
Hi, I'm Ryan. Want to get ahold of me? Check out [my website](http://rgaus.net).
