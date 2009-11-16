// bert.js
//
// Copyright (c) 2009 Ryan Tomayko <tomayko.com/about>
// See COPYING for licensing information.
// <http://github.com/rtomayko/node-bertrpc>
//
// Based heavily on the BERT-JS library by Rusty Klophaus:
// <http://github.com/rklophaus/BERT-JS>
//
// Copyright (c) 2009 Rusty Klophaus (@rklophaus)
// Contributions by Ben Browning (@bbrowning)
//
// References:
// - http://www.erlang-factory.com/upload/presentations/36/tom_preston_werner_erlectricity.pdf
// - http://www.erlang.org/doc/apps/erts/erl_ext_dist.html#8
//
// TODO string_to_bytes and Bytelist.toString
// TODO nil, boolean, dictionary encoding
// TODO time
// TODO regex
// TODO tests

/* BERT types are mapped to JavaScript types as follows:
 *
 *         +--------------+----------------+
 *         | BERT         | JavaScript     |
 *         +--------------+----------------+
 *         | atom         | bert.Atom      |
 *         | binary       | String         |
 *         | boolean      | true, false    |
 *         | bytelist     | bert.Bytelist  |
 *         | dictionary   | Object         |
 *         | float        | Number         |
 *         | integer      | Number         |
 *         | list         | Array          |
 *         | nil          | null           |
 *         | regex        | NOT SUPPORTED  |
 *         | tuple        | bert.Tuple     |
 *         | time         | NOT SUPPORTED  |
 *         +--------------+----------------+
 *
 */
BERT = {
   BERT_START:    String.fromCharCode(131),
   SMALL_ATOM:    String.fromCharCode(115),
   ATOM:          String.fromCharCode(100),
   BINARY:        String.fromCharCode(109),
   SMALL_INTEGER: String.fromCharCode(97),
   INTEGER:       String.fromCharCode(98),
   SMALL_BIG:     String.fromCharCode(110),
   LARGE_BIG:     String.fromCharCode(111),
   FLOAT:         String.fromCharCode(99),
   STRING:        String.fromCharCode(107),
   LIST:          String.fromCharCode(108),
   SMALL_TUPLE:   String.fromCharCode(104),
   LARGE_TUPLE:   String.fromCharCode(105),
   NIL:           String.fromCharCode(106),
   ZERO:          String.fromCharCode(0),

   /* BERT TYPE WRAPPER CLASSES */

   Atom: function (string) {
      this.type = "atom";
      this.value = string;
      this.toString = function () { return string };
   },

   Bytelist: function (string) {
      this.type = "bytelist";
      this.value = string;
      this.toString = function () { return "[" + BERT.string + "]"; };
   },

   Tuple: function (array) {
      this.type = "tuple";
      this.length = array.length;
      this.value = array;
      for (var i=0; i < array.length; i++) {
         this[i] = array[i];
      }
      this.toString = function () {
         var s = "";
         for (var i=0; i < this.length; i++) {
            if (s != "") s += ", ";
            s += this[i].toString();
         }
         return "{" + s + "}";
      }
   },

   /* CASTING TO BERT TYPES */

   atom: function (string) { return new BERT.Atom(string); },
   tuple: function () { return new BERT.Tuple(arguments); },
   bytelist: function (string) { return new BERT.Bytelist(string); },
   binary: function (string) { return string; },
   list: function (array) { return list; },
   dictionary: function (object) { return object; },

   /* BASIC INTERFACE */

   encode: function (obj) {
      return BERT.BERT_START + BERT.encode_inner(obj);
   },

   decode: function (data) {
      if (data[0] != BERT.BERT_START) throw("Not a valid BERT.");
      var obj = BERT.decode_inner(data.substring(1));
      if (obj.rest != "") throw("Invalid BERT.");
      return obj.value;
   },

   /* ENCODING */

   encode_inner: function (obj) {
      var type = typeof(obj);
      return this["encode_" + type].call(this, obj);
   },

   encode_string: function (obj) {
      return this.BINARY +
         this.int_to_bytes(obj.length, 4) +
         obj;
   },

   encode_bytelist: function (obj) {
      return this.STRING +
         this.int_to_bytes(obj.value.length, 2) +
         obj.value;
   },

   encode_boolean: function (obj) {
      if (obj) return this.encode_inner(this.atom("true"));
      else return this.encode_inner(this.atom("false"));
   },

   encode_number: function (obj) {
      var remainder = (obj % 1 != 0);

      if (remainder)
         return this.encode_float(obj);

      // small int...
      if (obj >= 0 && obj < 256)
         return this.SMALL_INTEGER + this.int_to_bytes(obj, 1);

      // 4 byte int...
      if (obj >= -134217728 && obj <= 134217727)
         return this.INTEGER + this.int_to_bytes(obj, 4);

      // bignum...
      var s = this.bignum_to_bytes(obj);
      if (s.length < 256) {
         return this.SMALL_BIG + this.int_to_bytes(s.length - 1, 1) + s;
      } else {
         return this.LARGE_BIG + this.int_to_bytes(s.length - 1, 4) + s;
      }
   },

   encode_float: function (obj) {
      var s = obj.toExponential();
      while (s.length < 31)
        s += this.ZERO;
      return this.FLOAT + s;
   },

   encode_object: function (obj) {
      if (obj.type == 'atom')
         return this.encode_atom(obj);
      if (obj.type == 'tuple')
         return this.encode_tuple(obj);
      if (obj.type == 'bytelist')
         return this.encode_bytelist(obj);
      if (obj.constructor.toString().indexOf("Array") != -1)
         return this.encode_list(obj);
      return this.encode_dictionary(obj);
   },

   encode_atom: function (obj) {
      return this.ATOM +
         this.int_to_bytes(obj.value.length, 2) +
         obj.value;
   },

   encode_binary: function (obj) {
      return this.BINARY +
         this.int_to_bytes(obj.value.length, 4) +
         obj.value;
   },

   encode_tuple: function (obj) {
      var s = "";
      if (obj.length < 256) {
         s += this.SMALL_TUPLE + this.int_to_bytes(obj.length, 1);
      } else {
         s += this.LARGE_TUPLE + this.int_to_bytes(obj.length, 4);
      }
      for (var i=0; i < obj.length; i++) {
         s += this.encode_inner(obj[i]);
      }
      return s;
   },

   encode_list: function (obj) {
      var s = this.LIST + this.int_to_bytes(obj.length, 4);
      for (var i=0; i < obj.length; i++) {
         s += this.encode_inner(obj[i]);
      }
      s += this.NIL;
      return s;
   },

   encode_dictionary: function (obj) {
      var array = new Array();
      for (var key in obj)
         array.push(this.tuple(this.atom(key), obj[key]));
      return this.encode_list(array);
   },

   /* DECODING */

   decode_inner: function (data) {
      var type = data[0];
      data = data.substring(1);
      if (type == this.SMALL_ATOM) return this.decode_atom(data, 1);
      if (type == this.ATOM) return this.decode_atom(data, 2);
      if (type == this.BINARY) return this.decode_binary(data);
      if (type == this.SMALL_INTEGER) return this.decode_integer(data, 1);
      if (type == this.INTEGER) return this.decode_integer(data, 4);
      if (type == this.SMALL_BIG) return this.decode_big(data, 1);
      if (type == this.LARGE_BIG) return this.decode_big(data, 4);
      if (type == this.FLOAT) return this.decode_float(data);
      if (type == this.STRING) return this.decode_bytelist(data);
      if (type == this.LIST) return this.decode_list(data);
      if (type == this.SMALL_TUPLE) return this.decode_tuple(data, 1);
      if (type == this.LARGE_TUPLE) return this.decode_large_tuple(data, 4);
      if (type == this.NIL) return this.decode_nil(data);
      throw("Unexpected BERT type: " + String.charCodeAt(type));
   },

   decode_atom: function (data, count) {
      var size = this.bytes_to_int(data, count);
      data = data.substring(count);
      var value = data.substring(0, size);
      if (value == "true") value = true;
      if (value == "false") value = false;
      return {
         value: this.atom(value),
         rest:  data.substring(size)
      };
   },

   decode_binary: function (data) {
      var size = this.bytes_to_int(data, 4);
      data = data.substring(4);
      return {
         value: data.substring(0, size),
         rest:  data.substring(size)
      };
   },

   decode_integer: function (data, count) {
      var value = this.bytes_to_int(data, count);
      data = data.substring(count);
      return {
         value: value,
         rest:  data
      };
   },

   decode_big: function (data, count) {
      var size = this.bytes_to_int(data, count);
      data = data.substring(count);
      var value = this.bytes_to_bignum(data, size);
      return {
         value: value,
         rest:  data.substring(size + 1)
      };
   },

   decode_float: function (data) {
      var size = 31;
      return {
         value: parseFloat(data.substring(0, size)),
         rest: data.substring(size)
      };
   },

   decode_bytelist: function (data) {
      var size = this.bytes_to_int(data, 2);
      data = data.substring(2);
      return {
         value: data.substring(0, size),
         rest:  data.substring(size)
      };
   },

   decode_list: function (data) {
      var size = this.bytes_to_int(data, 4);
      data = data.substring(4);
      var array = new Array();
      for (var i=0; i < size; i++) {
         var element = this.decode_inner(data);
         array.push(element.value);
         data = element.rest;
      }
      var last = data[0];
      if (last != this.NIL) throw("List does not end with NIL!");
      data = data.substring(1);
      return {
         value: array,
         rest:  data
      };
   },

   decode_tuple: function (data, count) {
      var size  = this.bytes_to_int(data, count),
          array = new Array();
      data = data.substring(count);
      for (var i=0; i < size; i++) {
         var element = this.decode_inner(data);
         array.push(element.value);
         data = element.rest;
      }
      return {
         value: this.tuple(array),
         rest:  data
      };
   },

   decode_nil: function (data) {
      return {
         value: new Array(),
         rest:  data
      };
   },

   /* UTILITY FUNCTIONS */

   // Encode an integer to a big-endian byte-string
   // of the length specified. Throw an exception if
   // the integer is too large to fit into the specified
   // number of bytes.
   int_to_bytes: function (int, length) {
      var negative = (int < 0),
          data = "",
          orig = int;
      if (negative) { int = ~int; }
      for (var i=0; i < length; i++) {
         var remainder = int % 256;
         if (negative) { remainder = 255 - remainder };
         data = String.fromCharCode(remainder) + data;
         int = Math.floor(int / 256);
      }
      if (int > 0) throw("Argument out of range: " + orig);
      return data;
   },

   // Read a big-endian encoded integer from the first length
   // bytes of the supplied string.
   bytes_to_int: function (data, length) {
      var num = 0,
          negative = (data.charCodeAt(0) > 128),
          n = null;
      for (var i=0; i < length; i++) {
         n = data.charCodeAt(i);
         if (negative) n = 255 - n;
         if (num == 0) num = n;
         else num = num * 256 + n;
      }
      if (negative) num = ~num;
      return num;
   },

   // Encode an integer into an Erlang bignum, which is a
   // byte of 1 or 0 representing whether the number is
   // negative or positive, followed by little-endian bytes.
   bignum_to_bytes: function (int) {
      var negative = int < 0,
          data = "";
      if (negative) {
         int *= -1;
         data += String.fromCharCode(1);
      } else {
         data += String.fromCharCode(0);
      }
      while (int != 0) {
         var remainder = int % 256;
         data += String.fromCharCode(remainder);
         int = Math.floor(int / 256);
      }
      return data;
   },

   // Encode a list of bytes into an Erlang bignum.
   bytes_to_bignum: function (data, count) {
      var negative = (data.charCodeAt(0) == 1),
          num = 0,
          n = null;
      data = data.substring(1);
      for (var i = count - 1; i >= 0; i--) {
         n = data.charCodeAt(i);
         if (num == 0) num = n;
         else num = num * 256 + n;
      }
      if (negative) num *= -1;
      return num;
   },

   // Convert an array of bytes into a string.
   bytes_to_string: function (bytes) {
      var string = "";
      for (var i=0; i < bytes.length; i++)
         string += String.fromCharCode(bytes[i]);
      return string;
   },

   /* FORMATTING */

   // pretty print a byte-string in erlang binary form
   pp_bytes: function (bin) {
      string = "";
      for (var i=0; i < bin.length; i++) {
         if (string != "") string += ",";
         string += "" + bin.charCodeAt(i);
      }
      return "<<" + string + ">>";
   },

   // pretty print a JS object in erlang term form
   pp_term: function (object) {
      return object.toString();
   },

   /* TESTS */

   // show off the different type of encodings we can handle.
   test_encode: function () {
      var sys = require('sys'),
       encode = BERT.encode,
           pp = function (obj) { sys.puts(BERT.pp_bytes(obj)) };
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
          pp  = function (term) { sys.puts(BERT.pp_term(term)); },
          B   = BERT.bytes_to_string;
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

// common JS
if ( exports ) {
  process.mixin(exports, BERT);
}

if ( require.main ) {
   sys = require('sys');
   sys.puts("running tests");
   BERT.test_encode();
   BERT.test_decode();
}

// vim: ft=javascript ts=3 sw=3 expandtab
