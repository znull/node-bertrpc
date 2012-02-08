var nodeunit = require('nodeunit');
var bert = require('../src/bert');

exports.testAtomRepr = function(test) {
    var obj = bert.atom("hello");
    test.strictEqual(bert.repr(obj), "hello");
    test.done();
};

exports.testAtomEncode = function(test) {
    var data = bert.encode(bert.atom("hello"));
    test.strictEqual(bert.bin_repr(data), "<<131,100,0,5,104,101,108,108,111>>");
    test.done();
};

exports.testAtomDecode = function(test) {
    var data = bert.encode(bert.atom("hello"));
    var obj = bert.decode(data);
    test.strictEqual(obj.type, 'atom');
    test.strictEqual(obj.toString(), 'hello');
    test.done();
};