var sys = require('sys'),
    tcp = require('tcp'),
    bert = require('./bert'),
    berp = require('./berp');

var bytes_to_int = bert.bytes_to_int,
    int_to_bytes = bert.int_to_bytes,
    t = bert.tuple,
    a = bert.atom,
    REPLY = bert.atom('reply');

var modules = { };

var BERTRPC = {
  /* expose all functions in object under the given module name. */
  expose: function (mod, object) {
    modules[mod] = object;
    sys.puts("  <--  exposing: " + mod);
    return object;
  },

  /* dispatch a call or cast on the module and function */
  dispatch: function (type, mod, fun, args) {
    var module = modules[mod];
    var func = module[fun.toString()];
    return func.apply(module, args);
  },

  trace: function (direction, message) {
     sys.puts("  " + direction + "  " + message);
  },

  /* the node server */
  server: tcp.createServer(function (socket) {
    var trace = BERTRPC.trace;
    socket.setEncoding("binary");

    socket.addListener("connect", function () {
       trace("-->", "connect");
    });

    socket.addListener("eof", function () {
      trace("-->", "eof");

      socket.close();
      trace("<--", "close");
    });

    var buf  = "",
        size = null;
    socket.addListener("receive", function (data) {
      buf += data;
      while ( size || buf.length >= 4 ) {
        if ( size == null ) {
          size = bytes_to_int(buf, 4);
          buf = buf.substring(4);
        } else if ( buf.length >= size ) {
          var raw = buf.substring(0, size);
          var term = bert.decode(raw);
          trace("-->", "" + size + ": " + bert.repr(term));

          // dispatch call to module handler
          var type = term[0],
               mod = term[1],
               fun = term[2],
              args = term[3];
          var res = BERTRPC.dispatch(type, mod, fun, args);

          // encode and throw back over the wire
          var reply = t(REPLY, res);
          socket.send(raw = berp.pack(reply));
          trace("<--", "" + (raw.length - 4) + ": " + bert.repr(reply));

          // keep eating into the buffer
          buf = buf.substring(size);
          size = null;
        } else {
          break;
        }
      }
    });
  }),

  /* begin listing on the port and host specified */
  listen: function (port, host) {
    BERTRPC.server.listen(port, host);
  }
};

process.mixin(exports, BERTRPC);
