# lsmod [![Build Status](https://secure.travis-ci.org/defunctzombie/node-lsmod.png?branch=master)](https://travis-ci.org/defunctzombie/node-lsmod)

lsmod fetches the list of modules and the versions loaded by the entry file for your node.js app.

## use

```javascript
var lsmod = require('lsmod');

// get an object with module version information
var modules = lsmod();

// modules is an object `key:version`
{
    express: '3.0.5',
    hbs: '2.0.1'
}
```

Note that the version is the actual installed version and not the dependency version string.

## install via [npm](https://npmjs.org)

```
npm install lsmod
```
