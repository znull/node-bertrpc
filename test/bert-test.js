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


