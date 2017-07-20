// mocha puts itself as main, we don't want that
require.main.paths.shift();
require.main.paths.shift();

var assert = require('assert');
var lsmod = require('./');

test('basic', function() {
    var modules = lsmod();

    // our own module is not present because it is not in node_modules
    assert.equal(modules.lsmod, undefined);

    // mocha is the only thing we have
    assert.equal(modules.mocha, '1.7.4');

    // diff is a dep of mocha and we should not get it as a result
    assert.equal(modules.diff, undefined);
});
