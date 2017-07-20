// builtin
var fs = require('fs');
var path = require('path');

// node 0.6 support
fs.existsSync = fs.existsSync || path.existsSync;

// main_paths are the paths where our mainprog will be able to load from
// we store these to avoid grabbing the modules that were loaded as a result
// of a dependency module loading its dependencies, we only care about deps our
// mainprog loads
var main_paths = require.main && require.main.paths || [];

module.exports = function() {
    var paths = Object.keys(require.cache || []);

    // module information
    var infos = {};

    // paths we have already inspected to avoid traversing again
    var seen = {};

    paths.forEach(function(p) {
        var dir = p;

        (function updir() {
            var orig = dir;
            dir = path.dirname(orig);

            if (!dir || orig === dir || seen[orig]) {
                return;
            }
            else if (main_paths.indexOf(dir) < 0) {
                return updir();
            }

            var pkgfile = path.join(orig, 'package.json');
            var exists = fs.existsSync(pkgfile);

            seen[orig] = true;

            // travel up the tree if no package.json here
            if (!exists) {
                return updir();
            }

            try {
                var info = JSON.parse(fs.readFileSync(pkgfile, 'utf8'));
                infos[info.name] = info.version;
            } catch (e) {};
        })();
    });

    return infos;
};
