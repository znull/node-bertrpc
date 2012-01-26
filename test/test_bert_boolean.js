var nodeunit = require('nodeunit');
var bert = require('../src/bert');

exports.testBooleanRepr = function(test) {
    test.strictEqual(bert.repr(true), '<true>');
    test.done();
};

exports.testBooleanEncode = function(test) {
    var obj = bert.encode(true);
    test.strictEqual(bert.bin_repr(obj), "<<131,104,2,100,0,4,98,101,114,116,100,0,4,116,114,117,101>>");
    test.done();
};

exports.testBooleanDecode = function(test) {
    var obj = bert.encode(true);
    test.strictEqual(bert.decode(obj), true);
    test.done();
};

