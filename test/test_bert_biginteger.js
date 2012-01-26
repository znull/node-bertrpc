var nodeunit = require('nodeunit');
var util = require('util');
var bert = require('../src/bert');

exports.testBigIntegerRepr = function(test) {
    test.strictEqual(bert.repr(28421841298),'28421841298');
    test.strictEqual(bert.repr(-28421841298),'-28421841298');
    test.done();
};

var bigIntegersEncoded = {};

bigIntegersEncoded[987654321] = "<<131,110,4,0,177,104,222,58>>";
bigIntegersEncoded[-987654321] = "<<131,110,4,1,177,104,222,58>>";

exports.testBigIntegerEncode = function(test) {
    for (var number in bigIntegersEncoded) {
        if (bigIntegersEncoded.hasOwnProperty(number)) {
            // use the + notation to cast the strings in the hash key
            // back to integers
            var actual = bert.encode(+number);
            test.strictEqual(bert.bin_repr(actual), bigIntegersEncoded[number]);
        }
    }
    test.done();
};

exports.testBigIntegerDecode = function(test) {
    for (var number in bigIntegersEncoded) {
        // use the + notation to cast the strings in the hash key
        // back to integers
        var actual = bert.decode(bert.encode(+number));
        test.strictEqual(actual, +number);
    }
    test.done();
};
