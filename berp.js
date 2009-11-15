var sys = require('sys'),
    bert = require('./bert');


var bytes_to_int = bert.bytes_to_int,
    int_to_bytes = bert.int_to_bytes;

process.mixin(exports, {
    pack: function (berp) {
      var data = bert.encode(berp);
      var res = int_to_bytes(data.length, 4) + data;
      return res;
    },

    unpack: function (buf) {
      return null;
    }
});
