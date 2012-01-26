var nodeunit = require('nodeunit');
var bert = require('../src/bert');

exports.testBinaryRepr = function(test) {
    var obj = "hello";
    test.strictEqual(bert.repr(obj), '<<"hello">>');
    test.done();
};

exports.testBinaryEncode = function(test) {
    var data = bert.encode("hello");
    test.strictEqual(bert.bin_repr(data), "<<131,109,0,0,0,5,104,101,108,108,111>>");
    test.done();
};

exports.testBinaryDecode = function(test) {
    var data = bert.encode("hello");
    test.strictEqual(bert.decode(data), "hello");
    test.done();
};

