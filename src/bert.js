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
// TODO time
// TODO regex
// TODO push / streaming


// BERT types are mapped to JavaScript types as follows:
//
//     +--------------+----------------+
//     | BERT         | JavaScript     |
//     +--------------+----------------+
//     | atom         | bert.Atom      |
//     | binary       | String         |
//     | boolean      | true, false    |
//     | bytelist     | bert.Bytelist  |
//     | dictionary   | Object         |
//     | float        | Number         |
//     | integer      | Number         |
//     | list         | Array          |
//     | nil          | null           |
//     | regex        | NOT SUPPORTED  |
//     | tuple        | bert.Tuple     |
//     | time         | NOT SUPPORTED  |
//     +--------------+----------------+
//


// frequently used atom objects; set after BERT is defined.
var _bert, _dict, _nil, _true, _false, _reply;

var BERT = {
   /* WIRE PROTOCOL CODES */

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
      this.repr = function () { return string }
      this.toString = function () { return string };
   },

   Bytelist: function (string) {
      this.type = "bytelist";
      this.value = string;
      this.toString = function () { this.value }
      this.repr = function () {
         var bytes = BERT.string_to_bytelist(this.value),
             string= "";
         for (var i=0; i < bytes.length; i++) {
            if (i > 0) string += ",";
            string += bytes[i];
         }
         return "<<" + string + ">>";
      }
   },

   Tuple: function (array) {
      this.type = "tuple";
      this.length = array.length;
      this.value = array;
      for (var i=0; i < array.length; i++)
         this[i] = array[i];
      this.repr = function () {
         var s = "";
         for (var i=0; i < this.length; i++) {
            if (i > 0) s += ", ";
            s += BERT.repr(this.value[i]);
         }
         return "{" + s + "}";
      }
      this.toString = this.repr;
   },

   /* CASTING TO BERT TYPES */

   atom: function (string) { return new BERT.Atom(string); },
   tuple: function () { return new BERT.Tuple(arguments); },
   tup: function (array) { return new BERT.Tuple(array); },
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
      if (obj) {
         return this.encode_tup(_bert, _true);
      } else {
         return this.encode_tup(_bert, _false);
      }
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
      if (obj == null)
         return this.encode_null(obj);
      if (obj.type == 'atom')
         return this.encode_atom(obj);
      if (obj.type == 'tuple')
         return this.encode_tuple(obj);
      if (obj.type == 'bytelist')
         return this.encode_bytelist(obj);
      if (obj.constructor.toString().indexOf("Array") >= 0)
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

   encode_tup: function () {
      return this.encode_tuple(this.tup(arguments));
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
      return this.encode_tup(_bert, _dict, array);
   },

   encode_null: function (obj) {
      return this.encode_tup(_bert, _nil);
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
      if (value == "true") {
         value = _true;
      } else if (value == "false") {
         value = _false;
      } else if (value == "bert") {
         value = _bert;
      } else if (value == "nil") {
         value = _nil;
      } else if (value == "dict") {
         value = _dict;
      } else {
         value = this.atom(value);
      }
      return {
         value: value,
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
         value: this.bytelist(data.substring(0, size)),
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
          array = new Array(),
          value = null;
      data = data.substring(count);
      for (var i=0; i < size; i++) {
         var element = this.decode_inner(data);
         array.push(element.value);
         data = element.rest;
      }
      if (array[0] == _bert) {
         if ( array[1] == _dict )   {
            var list = array[2],
                dict = {},
                item = null;
            for(var i=0; i < list.length; i++) {
               item = list[i];
               if ( item[0] === null ) {
                  dict[null] = item[1];
               } else if ( item[0].type == 'atom' ) {
                  dict[item[0].toString()] = item[1];
               } else {
                  dict[item[0]] = item[1];
               }
            }
            value = dict;
         }
         else if ( array[1] == _nil )    { value = null;  }
         else if ( array[1] == _true )   { value = true;  }
         else if ( array[1] == _false )  { value = false; }
         else
            throw 'unsupported complex tuple: {bert, ' + array[1] + '}';
      }else{
         value = this.tup(array);
      }
      return {value:value, rest:data};
   },

   decode_nil: function (data) {
      return {
         value: [],
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
   // bytes of the supplied string. When length is a single byte,
   // just return the unsigned byte value.
   bytes_to_int: function (data, length) {
      if ( length == 1 )
         return data.charCodeAt(i);

      var num = 0,
          negative = (length > 1 && data.charCodeAt(0) > 128),
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
   bytelist_to_string: function (bytes) {
      var string = "";
      for (var i=0; i < bytes.length; i++)
         string += String.fromCharCode(bytes[i]);
      return string;
   },

   string_to_bytelist: function (string) {
      var bytelist = new Array();
      for (var i=0; i < string.length; i++)
         bytelist[i] = string.charCodeAt(i);
      return bytelist;
   },

   /* FORMATTING */

   bin_repr: function (obj) {
      return BERT.repr(BERT.bytelist(obj));
   },

   // pretty print a JS object in erlang term form
   repr: function (obj) {
      if (obj === null)
         return "<nil>";

      if (obj === true)
         return "<true>";

      if (obj === false)
         return "<false>";

      if (typeof(obj) == 'string')
         return "<<\"" + obj + "\">>";

      // numbers, booleans, stuff like that
      if (typeof(obj) != 'object')
         return obj.toString();

      // BERT special types: atom, tuple, bytelist
      if (obj.repr)
         return obj.repr();

      // arrays
      if (obj.constructor.toString().indexOf("Array") >= 0) {
         var s = "";
         for (var i = 0; i < obj.length; i++) {
            if (i > 0) s += ", ";
            s += BERT.repr(obj[i])
         }
         return "[" + s + "]";
      }

      // Assume it's a dictionary
      var s = "", prev = null;
      for (var key in obj) {
         var val = obj[key];
         if ( typeof(key) == 'string' )
            key = BERT.atom(key);
         if ( prev ) s += ", ";
         s += BERT.repr(BERT.tuple(key, val));
         prev = val;
      }
      return "[" + s + "]";
   }
};

_bert  = BERT.atom('bert');
_nil   = BERT.atom('nil');
_dict =  BERT.atom('dict');
_true  = BERT.atom('true');
_false = BERT.atom('false');
_reply = BERT.atom('reply');

// common JS
exports = module.exports = BERT;

// vim: ft=javascript ts=3 sw=3 expandtab
