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
  _modules: {},

  expose: function (mod, object) {
    modules[mod] = object;
    sys.puts("  <--  exposing: " + mod);
    return object;
  },

  dispatch: function (type, mod, fun, args) {
    var module = modules[mod];
    var func = module[fun.toString()];
    return func.apply(module, args);
  },

  server: function () {
    return tcp.createServer(function (socket) {
      socket.setEncoding("binary");
      socket.addListener("connect", function () { sys.puts("  -->  connect"); });

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
            var term = bert.decode(raw)[0];
            sys.puts("  -->  [" + size + "] {" + term + "}");

            // dispatch call to module handler
            var type = term[0],
                 mod = term[1],
                 fun = term[2],
                args = term[3];
            var res = BERTRPC.dispatch(type, mod, fun, args);

            // encode and throw back over the wire
            raw = berp.pack(t(REPLY, res));
            sys.puts("  <--  [" + (raw.length - 4) + "] " + t(REPLY, res));
            socket.send(raw)

            // keep eating into the buffer
            buf = buf.substring(size);
            size = null;
          } else {
            break;
          }
        }
      });
      socket.addListener("eof", function () {
        sys.puts("  -->  eof");
        sys.puts("  <--  close");
        socket.close();
      });
    });
  },

  listen: function (port, host) {
    BERTRPC.server().listen(port, host);
  }
};

process.mixin(exports, BERTRPC);
