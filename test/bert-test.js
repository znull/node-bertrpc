var sys = require('sys'),
   bert = require('../src/bert');

BertTest = {
   // show off the different type of encodings we can handle.
   test_encode: function () {
      var sys = require('sys'),
       encode = BERT.encode,
           pp = function (obj) { sys.puts(BERT.bytelist(obj).repr()) };
      pp(encode(BERT.atom("hello")));
      pp(encode(BERT.binary("hello")));
      pp(encode(true));
      pp(encode(42));
      pp(encode(5000));
      pp(encode(-5000));
      pp(encode(987654321));
      pp(encode(-987654321));
      pp(encode(3.14159));
      pp(encode(-3.14159));
      pp(encode([1, 2, 3]));
      pp(encode({a:1, b:2, c:3}));
      pp(encode(BERT.tuple("Hello", 1)));
      pp(encode([]));
      pp(encode({
         a : BERT.tuple(1, 2, 3),
         b : [4, 5, 6]
      }));
   },

   test_decode: function () {
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
   }
};

for (test in BertTest) {
   if ( test.match(/^test_/) )
      BertTest[test].call(BertTest);
}
