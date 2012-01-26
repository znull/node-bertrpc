var util = require('util'),
   bert = require('../src/bert'),
   test_helper = require('./test');

test_helper.extend(GLOBAL, test_helper);

var encode = bert.encode,
    decode = bert.decode,
    R =      bert.repr,
    dump =   function (obj) { util.puts(obj) },
    bin =    bert.bin_repr,
    dump_bin = function (obj) { util.puts(bert.bin_repr(obj)) };

var data = null,
    obj  = null;

// DICTIONARIES

obj = {a:1, b:2, c:3};

test('bert.repr({a:1, b:2, c:3})', function() {
   dump(util.inspect(obj));
   dump(R(obj));
   assert_equal("[{a, 1}, {b, 2}, {c, 3}]", bert.repr(obj));
});

test('bert.encode({a:1, b:2, c:3})', function() {
   data = encode(obj);
   assert_equal(
      "<<131,104,3,100,0,4,98,101,114,116,100,0,4,100,105,99,116,108,0,0,0,3,104,2,100,0,1,97,97,1,104,2,100,0,1,98,97,2,104,2,100,0,1,99,97,3,106>>",
      bin(data)
   );
});

test('bert.decode({a:1, b:2, c:3})', function() {
   dump(util.inspect(obj));
   obj = decode(data);
   dump(util.inspect(obj));
   dump(R(obj));
   assert_equal(1, obj['a']);
   assert_equal(2, obj['b']);
   assert_equal(3, obj['c']);
});

// TUPLES

obj = bert.tuple("Hello", 1);

test('bert.encode(<tuple>)', function() {
   data = encode(obj);
   assert_equal("<<131,104,2,109,0,0,0,5,72,101,108,108,111,97,1>>", bin(data))
});

test('bert.repr(<tuple>)', function() {
   dump(util.inspect(obj));
   dump(R(obj));
   assert_equal('{<<"Hello">>, 1}', bert.repr(obj));
});

test('bert.decode(<tuple>)', function() {
   obj = decode(data);
   assert_equal("tuple", obj.type);
   assert_equal(2, obj.length);
   assert_equal("Hello", obj[0]);
   assert_equal(1, obj[1]);
});

// EMPTY LISTS

obj = []

test('bert.repr([])', function() {
   dump(util.inspect(obj));
   dump(R(obj));
   assert_equal('[]', bert.repr(obj));
});

test('bert.encode([])', function() {
   data = encode(obj)
   assert_equal("<<131,108,0,0,0,0,106>>", bin(data))
});

test('bert.decode([])', function() {
   obj = decode(data);
   assert_equal(0, obj.length);
});

// COMPLEX DICTIONARY

obj = { a: bert.tuple(1, 2, 3), b: [4, 5, 6] }

test('bert.repr(<complex>)', function() {
   dump(util.inspect(obj));
   dump(R(obj));
   assert_equal("[{a, {1, 2, 3}}, {b, [4, 5, 6]}]", bert.repr(obj));
});

test('bert.encode(<complex>)', function () {
   data = encode(obj);
   assert_equal(
      "<<131,104,3,100,0,4,98,101,114,116,100,0,4,100,105,99,116,108,"  +
      "0,0,0,2,104,2,100,0,1,97,104,3,97,1,97,2,97,3,104,2,100,0,1,98," +
      "108,0,0,0,3,97,4,97,5,97,6,106,106>>",
      bin(data)
   );
});

test('bert.decode(<complex>)', function() {
   obj = decode(data);
   dump(util.inspect(obj));
   dump(R(obj));
   assert_equal('object', typeof(obj));
   assert_equal('tuple',  obj.a.type);
   assert_equal(1, obj.a[0]);
   assert_equal(2, obj.a[1]);
   assert_equal(3, obj.a[2]);
});
