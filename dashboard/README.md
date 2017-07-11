# Backstroke Dashboard

## Overview
The Backstroke dashboard interacts with the api to provide a simple management interface for
Backstroke links.

<img src="http://i.imgur.com/YuK5Nd8.png" width="" />
<img src="http://i.imgur.com/GuwtFiu.png" width="400" />

# Development
1. Yarn is used to manage dependencies - run `yarn` to download all dependencies of the dashboard. 
2. [Biome](https://github.com/1egoman/biome) is used to manage environment variables for the
   project. Run `biome` to set the contents of all variables, then run `biome use` to spawn a
   subshell with the environment sourced. (If you'd rather not use biome, then set all the
   environment variables in the `Biomefile` manually)
3. Finally, run `yarn start` to start the development server.
4. To make a production build, run `yarn build`.

## Environment variables disambiguation
- `REACT_APP_APP_URL`: The path to this project. In production, this is `https://app.backstroke.us`.
- `REACT_APP_API_URL`: The path to the api that this project interacts with. In production, this is
  `https://api.backstroke.us`.
- `REACT_APP_ROOT_URL`: The path to the main site. In production, this is `https://backstroke.us`.
