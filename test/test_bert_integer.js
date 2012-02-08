var nodeunit = require('nodeunit');
var util = require('util');
var bert = require('../src/bert');

exports.testIntegerRepr = function(test) {
    test.strictEqual(bert.repr(42),'42');
    test.strictEqual(bert.repr(-42),'-42');
    test.done();
};

var integersEncoded = {};

integersEncoded[42] = "<<131,97,42>>";
integersEncoded[144] = "<<131,97,144>>";
integersEncoded[-144] = "<<131,98,255,255,255,112>>";
integersEncoded[5000] = "<<131,98,0,0,19,136>>";
integersEncoded[-5000] = "<<131,98,255,255,236,120>>";

exports.testIntegerEncode = function(test) {
    for (var number in integersEncoded) {
        if (integersEncoded.hasOwnProperty(number)) {
            // use the + notation to cast the strings in the hash key
            // back to integers
            var actual = bert.encode(+number);
            test.strictEqual(bert.bin_repr(actual), integersEncoded[number]);
        }
    }
    test.done();
};

exports.testIntegerDecode = function(test) {
    for (var number in integersEncoded) {
        // use the + notation to cast the strings in the hash key
        // back to integers
        var actual = bert.decode(bert.encode(+number));
        test.strictEqual(actual, +number);
    }
    test.done();
};
