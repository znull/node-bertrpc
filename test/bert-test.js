var sys = require('sys'),
   bert = require('../src/bert');
process.mixin(GLOBAL, require('./test'));

var encode = bert.encode,
    decode = bert.decode,
    R =      bert.repr,
    dump =   function (obj) { sys.puts(obj) },
    bin =    bert.bin_repr,
    dump_bin = function (obj) { sys.puts(bert.bin_repr(obj)) };

var data = null,
    obj  = null;

// ATOM

obj = BERT.atom("hello");

test('bert.repr(<atom>)', function() {
   dump(sys.inspect(obj));
   dump(R(obj));
   assert_equal("hello", bert.repr(obj));
});

test('bert.encode(<atom>)', function() {
   data = encode(obj);
   assert_equal("<<131,100,0,5,104,101,108,108,111>>", bin(data));
});

test('bert.decode(<atom>)', function() {
   obj = decode(data);
   assert_equal('atom', obj.type);
   assert_equal('hello', obj.toString());
});

// BINARY

obj = "hello";

test('bert.repr(<atom>)', function() {
   dump(sys.inspect(obj));
   dump(R(obj));
   assert_equal('<<"hello">>', bert.repr(obj));
});

test('bert.encode(<binary>)', function() {
   data = encode("hello");
   assert_equal("<<131,109,0,0,0,5,104,101,108,108,111>>", bin(data));
});

test('bert.decode(<binary>)', function() {
   obj = decode(data);
   assert_equal('hello', obj);
});

// BOOLEAN

obj = true

test('bert.repr(<atom>)', function() {
   dump(sys.inspect(obj));
   dump(R(obj));
   assert_equal('true', bert.repr(obj));
});

test('bert.encode(true)', function() {
   data = encode(obj);
   assert_equal("<<131,100,0,4,116,114,117,101>>", bin(data));
});

test('bert.decode(true)', function() {
   obj = decode(data);
   assert_equal(true, obj);
});

// INTEGER

test('bert.repr(<numbers>)', function() {
   assert_equal('42', bert.repr(42));
   assert_equal('-42', bert.repr(-42));
   assert_equal('28421841298', bert.repr(28421841298));
   assert_equal('-28421841298', bert.repr(-28421841298));
});

test('bert.encode(42)', function() {
   data = encode(42);
   assert_equal("<<131,97,42>>", bin(data));
});

test('bert.decode(42)', function() {
   obj = decode(data);
   assert_equal(42, obj);
});

test('bert.encode(5000)', function() {
   data = encode(5000);
   assert_equal("<<131,98,0,0,19,136>>", bin(data));
});

test('bert.decode(5000)', function() {
   obj = decode(data);
   assert_equal(5000, obj);
});

test('bert.encode(-5000)', function() {
   data = encode(-5000);
   assert_equal("<<131,98,255,255,236,120>>", bin(data));
});

test('bert.decode(-5000)', function() {
   obj = decode(data);
   assert_equal(-5000, obj);
});

// BIG INTEGERS

test('bert.encode(987654321)', function() {
   data = encode(987654321);
   assert_equal("<<131,110,4,0,177,104,222,58>>", bin(data));
});

test('bert.decode(987654321)', function() {
   obj = decode(data);
   assert_equal(987654321, obj);
});

test('bert.encode(-987654321)', function() {
   data = encode(-987654321);
   assert_equal("<<131,110,4,1,177,104,222,58>>", bin(data));
});

test('bert.decode(-987654321)', function() {
   obj = decode(data);
   assert_equal(-987654321, obj);
});

// FLOAT

test('bert.encode(3.14159)', function() {
   data = encode(3.14159);
   assert_equal(
      "<<131,99,51,46,49,52,49,53,57,101,43,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0>>",
      bin(data)
   );
});

test('bert.decode(3.14159)', function() {
   obj = decode(data);
   assert_equal(3.14159, obj);
});

test('bert.encode(-3.14159)', function() {
   data = encode(-3.14159);
   assert_equal(
      "<<131,99,45,51,46,49,52,49,53,57,101,43,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0>>",
      bin(encode(-3.14159))
   );
});

test('bert.decode(-3.14159)', function() {
   obj = decode(data);
   assert_equal(-3.14159, obj);
});

// LISTS

obj = [1, 2, 3]

test('bert.encode([1, 2, 3])', function() {
   data = encode(obj);
   assert_equal("<<131,108,0,0,0,3,97,1,97,2,97,3,106>>", bin(data));
});

test('bert.repr([1, 2, 3])', function() {
   dump(sys.inspect(obj));
   dump(R(obj));
   assert_equal("[1, 2, 3]", bert.repr(obj));
});

test('bert.decode([1, 2, 3])', function() {
   obj = decode(data);
   assert_equal('object', typeof(obj));
   assert_equal(3, obj.length);
   assert_equal(1, obj[0]);
   assert_equal(2, obj[1]);
   assert_equal(3, obj[2]);
});

// DICTIONARIES

obj = {a:1, b:2, c:3};

test('bert.encode({a:1, b:2, c:3})', function() {
   data = encode(obj);
   assert_equal(
      "<<131,108,0,0,0,3,104,2,100,0,1,97,97,1,104,2,100,0,1,98,97,2,104,2,100,0,1,99,97,3,106>>",
      bin(data)
   );
});

test('bert.repr({a:1, b:2, c:3})', function() {
   dump(sys.inspect(obj));
   dump(R(obj));
   assert_equal("[{a, 1}, {b, 2}, {c, 3}]", bert.repr(obj));
});

test('bert.decode({a:1, b:2, c:3})', function() {
   obj = decode(data);
   assert_equal({a: 1, b:2, c:3}, obj);
});

// TUPLES

obj = bert.tuple("Hello", 1);

test('bert.encode(<tuple>)', function() {
   data = encode(obj);
   assert_equal("<<131,104,2,109,0,0,0,5,72,101,108,108,111,97,1>>", bin(data))
});

test('bert.repr(<tuple>)', function() {
   dump(sys.inspect(obj));
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
   dump(sys.inspect(obj));
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

obj = { a: BERT.tuple(1, 2, 3), b: [4, 5, 6] }

test('bert.repr(<complex>)', function() {
   dump(sys.inspect(obj));
   dump(R(obj));
   assert_equal("[{a, {1, 2, 3}}, {b, [4, 5, 6]}]", bert.repr(obj));
});

test('bert.encode(<complex>)', function () {
   data = encode(obj);
   assert_equal("<<131,108,0,0,0,2,104,2,100,0,1,97,104,3,97,1,97,2,97,3,104,2,100,0,1,98,108,0,0,0,3,97,4,97,5,97,6,106,106>>", bin(data))
});

test('bert.decode(<complex>)', function() {
   obj = decode(data);
   assert_equal('object', obj.type);
   assert_equal('tuple',  obj.a.type);
   assert_equal(1, obj.a[0]);
   assert_equal(2, obj.a[1]);
   assert_equal(3, obj.a[2]);
});
