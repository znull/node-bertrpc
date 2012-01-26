var nodeunit = require('nodeunit');
var bert = require('../src/bert');

exports.testListRepr = function(test) {
    var data = bert.repr([1,2,3]);
    test.strictEqual(data, "[1, 2, 3]");
    test.done();
};

exports.testListEncode = function(test) {
    var data = bert.encode([1, 2, 3]);
    test.strictEqual(bert.bin_repr(data), "<<131,108,0,0,0,3,97,1,97,2,97,3,106>>");
    test.done();
};

exports.testListDecode = function(test) {
    var data = bert.encode([1,2,3]);
    var obj = bert.decode(data);
    test.strictEqual(typeof(obj), 'object');
    test.strictEqual(obj.length, 3);
    test.strictEqual(obj[0], 1);
    test.strictEqual(obj[1], 2);
    test.strictEqual(obj[2], 3);
    test.done();
};