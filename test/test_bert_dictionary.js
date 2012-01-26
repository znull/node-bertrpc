var nodeunit = require('nodeunit');
var bert = require('../src/bert');

exports.testDictRepr = function(test) {
    test.strictEqual(bert.repr({a:1, b:2, c:3}), "[{a, 1}, {b, 2}, {c, 3}]");
    test.done();
};

exports.testDictEncode = function(test) {
    var data = bert.encode({a:1, b:2, c:3});
    var expected = "<<131,104,3,100,0,4,98,101,114,116,100,0,4,100,105,99,116,108,0,0,0,3,104,2,100,0,1,97,97,1,104,2,100,0,1,98,97,2,104,2,100,0,1,99,97,3,106>>";
    test.strictEqual(bert.bin_repr(data), expected);
    test.done();
};

exports.testDictDecode = function(test) {
    var data = bert.encode({a:1, b:2, c:3});
    var obj = bert.decode(data);
    test.strictEqual(obj['a'], 1);
    test.strictEqual(obj['b'], 2);
    test.strictEqual(obj['c'], 3);
    test.done();
};