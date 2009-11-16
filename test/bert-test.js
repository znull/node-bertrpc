var sys = require('sys'),
   bert = require('../src/bert');
process.mixin(GLOBAL, require('./test'));

var encode = bert.encode,
    decode = bert.decode,
    R =      bert.repr,
    dump =   function (obj) { sys.puts(obj) },
    bin =    bert.bin_repr,
    dump_bin = function (obj) { sys.puts(bert.bin_repr(obj)) };

test('bert.encode(<atom>)', function() {
   var data = encode(BERT.atom("hello"));
   dump(R(decode(data)));
   assert_equal("<<131,100,0,5,104,101,108,108,111>>", bin(data));
});

test('bert.encode(<binary>)', function() {
   var data = encode(BERT.binary("hello"));
   dump(R(decode(data)));
   assert_equal("<<131,109,0,0,0,5,104,101,108,108,111>>", bin(data));
});

test('bert.encode(true)', function() {
   var data = encode(true);
   dump(R(decode(data)));
   assert_equal("<<131,100,0,4,116,114,117,101>>", bin(data));
});

test('bert.encode(42)', function() {
   var data = encode(42);
   dump(R(decode(data)));
   assert_equal("<<131,97,42>>", bin(data));
});

test('bert.encode(5000)', function() {
   var data = encode(5000);
   dump(R(decode(data)));
   assert_equal("<<131,98,0,0,19,136>>", bin(data));
});

test('bert.encode(-5000)', function() {
   var data = encode(-5000);
   dump(R(decode(data)));
   assert_equal("<<131,98,255,255,236,120>>", bin(data));
});

test('bert.encode(987654321)', function() {
   var data = encode(987654321);
   dump(R(decode(data)));
   assert_equal("<<131,110,4,0,177,104,222,58>>", bin(data));
});

test('bert.encode(-987654321)', function() {
   var data = encode(-987654321);
   dump(R(decode(data)));
   assert_equal("<<131,110,4,1,177,104,222,58>>", bin(data));
});

test('bert.encode(3.14159)', function() {
   var data = encode(3.14159);
   dump(R(decode(data)));
   assert_equal(
      "<<131,99,51,46,49,52,49,53,57,101,43,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0>>",
      bin(data)
   );
});

test('bert.encode(-3.14159)', function() {
   assert_equal(
      "<<131,99,45,51,46,49,52,49,53,57,101,43,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0>>",
      bin(encode(-3.14159))
   );
});

test('bert.encode([1, 2, 3])', function() {
   var data = encode([1, 2, 3]);
   dump(R(decode(data)));
   assert_equal("<<131,108,0,0,0,3,97,1,97,2,97,3,106>>", bin(data));
});

test('bert.encode({a:1, b:2, c:3})', function() {
   var data = encode({a:1, b:2, c:3});
   dump(R(decode(data)));
   assert_equal("<<131,108,0,0,0,3,104,2,100,0,1,97,97,1,104,2,100,0,1,98,97,2,104,2,100,0,1,99,97,3,106>>", bin(data));
});

test('bert.encode(<tuple>)', function() {
   var data = encode(bert.tuple("Hello", 1));
   dump(R(decode(data)));
   assert_equal("<<131,104,2,109,0,0,0,5,72,101,108,108,111,97,1>>", bin(data))
});

test('bert.encode([])', function() {
   var data = encode([]);
   dump(R(decode(data)));
   assert_equal("<<131,108,0,0,0,0,106>>", bin(data))
});

test('bert.encode(<dictionary>)', function () {
   var data = encode({
      a : BERT.tuple(1, 2, 3),
      b : [4, 5, 6]
   });
   dump(R(decode(data)));
   assert_equal("<<131,108,0,0,0,2,104,2,100,0,1,97,104,3,97,1,97,2,97,3,104,2,100,0,1,98,108,0,0,0,3,97,4,97,5,97,6,106,106>>", bin(data))
});

test('BERT.decode', function() {
   var sys = require('sys'),
       pp  = function (term) { sys.puts(BERT.repr(term)); },
       B   = BERT.bytelist_to_string;
   // Try decoding this: [{atom, myAtom},{binary, <<"My Binary">>},{bool, true}, {string, "Hello there"}],
   TestTerm1 = B([131,108,0,0,0,4,104,2,100,0,4,97,116,111,109,100,0,6,109,121,65,116,111,109,104,2,100,0,6,98,105,110,97,114,121,109,0,0,0,9,77,121,32,66,105,110,97,114,121,104,2,100,0,4,98,111,111,108,100,0,4,116,114,117,101,104,2,100,0,6,115,116,114,105,110,103,107,0,11,72,101,108,108,111,32,116,104,101,114,101,106]);
   pp(BERT.decode(TestTerm1));
   // Try decoding this: [{small_integer, 42},{integer1, 5000},{integer2, -5000},{big_int1, 987654321},{big_int2, -987654321}],
   TestTerm2 = B([131,108,0,0,0,5,104,2,100,0,13,115,109,97,108,108,95,105,110,116,101,103,101,114,97,42,104,2,100,0,8,105,110,116,101,103,101,114,49,98,0,0,19,136,104,2,100,0,8,105,110,116,101,103,101,114,50,98,255,255,236,120,104,2,100,0,8,98,105,103,95,105,110,116,49,110,4,0,177,104,222,58,104,2,100,0,8,98,105,103,95,105,110,116,50,110,4,1,177,104,222,58,106]);
   pp(BERT.decode(TestTerm2));
   // Try decoding this: -3.14159
   TestTerm3 = B([131,99,45,51,46,49,52,49,53,56,57,57,57,57,57,57,57,57,57,57,56,56,50,54,50,101,43,48,48,0,0,0,0]);
   pp(BERT.decode(TestTerm3));
   // Try decoding this: [] (empty list)
   TestTerm4 = B([131,106]);
   pp(BERT.decode(TestTerm4));
   return true;
});
