var nodeunit = require('nodeunit');
var bert = require('../src/bert');

exports.testTupleRepr = function(test) {
    var obj = bert.tuple("Hello", 1);
    test.strictEqual(bert.repr(obj), '{<<"Hello">>, 1}');
    test.done();
};

exports.testTupleEncode = function(test) {
    var data = bert.encode(bert.tuple("Hello", 1));
    test.strictEqual(bert.bin_repr(data), "<<131,104,2,109,0,0,0,5,72,101,108,108,111,97,1>>")
    test.done();
};

exports.testTupleDecode = function(test) {
    var data = bert.encode(bert.tuple("Hello", 1));
    var obj = bert.decode(data);
    test.strictEqual(obj.type, 'tuple');
    test.strictEqual(obj.length, 2);
    test.strictEqual(obj[0], "Hello");
    test.strictEqual(obj[1], 1);
    test.done();
};