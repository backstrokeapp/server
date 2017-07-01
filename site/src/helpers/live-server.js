import liveServer from 'live-server';
liveServer.start({
  host: "0.0.0.0",
  root: "build/",
  wait: 1000,
  logLevel: 2, // 0 = errors only, 1 = some, 2 = lots 
});
