process.mixin(GLOBAL, require('./test'));

var util = require('util'),
bertrpc = require('../src/bertrpc'),
   bert = require('../src/bert');

var TestModule = {
   foo: function (a, b) {
      return ['foo', 'bar', a, b];
   },

   other: 'hello'
}

// EXPOSING MODULES

test('bertrpc.expose', function () {
   bertrpc.expose('test', TestModule);
   assert(bertrpc.modules.test == TestModule);
});

// LOW LEVEL DISPATCH

test('bertrpc.dispatch', function () {
   res = bertrpc.dispatch('call', 'test', 'foo', [1, 2]);
   assert_equal('foo', res[0]);
   assert_equal('bar', res[1]);
   assert_equal(1, res[2]);
   assert_equal(2, res[3]);
});

test('bertrpc.dispatch to bad module', function () {
   assert_boom('no such module', function () {
      bertrpc.dispatch('call', 'foo', 'bar', []);
   });
});

test('bertrpc.dispatch to a non-existent attribute', function () {
   assert_boom('no such fun', function () {
      bertrpc.dispatch('call', 'test', 'bar', []);
   });
});

test('bertrpc.dispatch to a non-func attribute', function () {
   assert_boom('no such fun', function () {
      bertrpc.dispatch('call', 'test', 'other', []);
   });
});

// READING BERPS

test('reads berps from an fd', function () {
   var packet = bert.encode('hi'),
       did    = 0;
   var berp = bert.int_to_bytes(packet.length, 4) + packet;

   var fd = {
      addListener: function (event, callback) {
         assert_equal('receive', event);
         callback(berp + berp + berp);
      }
   };

   bertrpc.read(fd, function (size, term) {
      assert_equal(packet.length, size);
      assert_equal('hi', term);
      did += 1;
   });

   assert_equal(3, did);
});

// WRITING BERPS

test('writes berps to an fd', function () {
   var buf = '', fd = {
      send: function (data) {
         buf += data;
      }
   };
   bertrpc.write(fd, 'hello world');

   var packet = bert.encode('hello world');
   var berp = bert.int_to_bytes(packet.length, 4) + packet;
   assert_equal(berp, buf)
});
