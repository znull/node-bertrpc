var nodeunit = require('nodeunit');
var bertrpc = require('../src/bertrpc');
var bert = require('../src/bert');

var TestModule = {
    foo: function (a, b) {
        return ['foo', 'bar', a, b];
    },

    other: 'hello'
};

exports.testExpose = function(test) {
    bertrpc.expose('test', TestModule);
    test.equals(bertrpc.modules.test, TestModule);
    test.done();
};

exports.testDispatch = function(test) {
    var res = bertrpc.dispatch('call', 'test', 'foo', [1, 2]);
    test.strictEqual(res[0], 'foo');
    test.strictEqual(res[1], 'bar');
    test.strictEqual(res[2], 1);
    test.strictEqual(res[3], 2);
    test.done();
};

//exports.testDispatchMissingArgs = function(test) {
//    test.throws(function() {
//        bertrpc.dispatch('call', 'test', 'foo', []);
//    });
//    test.done();
//};


exports.testDispatchBadModule = function(test) {
    test.throws(function() {
        bertrpc.dispatch('call', 'foo', 'bar', []);
    });
    test.done();
};

exports.testDispatchBadAttribute = function(test) {
    test.throws(function() {
        bertrpc.dispatch('call', 'test', 'bar', []);
    });
    test.done();
};

exports.testDispatchNonFunction = function(test) {
    test.throws(function() {
        bertrpc.dispatch('call', 'test', 'other', []);
    });
    test.done();
};

exports.testReadBerpFromFD = function(test) {
    var packet = bert.encode('hi');
    var did = 0;
    var berp = bert.int_to_bytes(packet.length, 4) + packet;

    var fd = {
        addListener: function (event, callback) {
            test.equals(event, 'receive');
            callback(berp + berp + berp);
        }
    };

    bertrpc.read(fd, function (size, term) {
        test.strictEqual(size, packet.length);
        test.equals(term, 'hi');
        did++;
    });

    test.strictEqual(did, 3);
    test.done();
};

exports.testWriteBerpToFD = function(test) {
    var buf = '';
    var fd = {
        send: function (data) {
            buf += data;
        }
    };

    bertrpc.write(fd, 'hello world');
    var packet = bert.encode('hello world');
    var berp = bert.int_to_bytes(packet.length, 4) + packet;
    test.strictEqual(buf, berp);
    test.done();
};

