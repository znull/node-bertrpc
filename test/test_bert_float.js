var nodeunit = require('nodeunit');
var util = require('util');
var bert = require('../src/bert');

exports.testFloatRepr = function(test) {
    test.strictEqual(bert.repr(3.14159),'3.14159');
    test.strictEqual(bert.repr(-3.14159),'-3.14159');
    test.done();
};

var floatsEncoded = {};

floatsEncoded[3.14159] = "<<131,99,51,46,49,52,49,53,57,101,43,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0>>";
floatsEncoded[-3.14159] = "<<131,99,45,51,46,49,52,49,53,57,101,43,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0>>";

exports.testFloatEncode = function(test) {
    for (var number in floatsEncoded) {
        if (floatsEncoded.hasOwnProperty(number)) {
            // use the + notation to cast the strings in the hash key
            // back to integers
            var actual = bert.encode(+number);
            test.strictEqual(bert.bin_repr(actual), floatsEncoded[number]);
        }
    }
    test.done();
};

exports.testFloatDecode = function(test) {
    for (var number in floatsEncoded) {
        // use the + notation to cast the strings in the hash key
        // back to integers
        var actual = bert.decode(bert.encode(+number));
        test.strictEqual(actual, +number);
    }
    test.done();
};

exports.testNewFloatDecode = function(test) {
    pi = 3.14159;
    piEncoded = new Buffer([131, 70, 64, 9, 33, 249, 240, 27, 134, 110]);
    var actual = bert.decode_buffer(piEncoded);
    test.strictEqual(actual, pi);
    test.done();
};
