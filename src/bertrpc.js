// bertrpc.js
//
// BERT-RPC is a schemaless binary remote procedure call
// protocol by Tom Preston-Warner. It's based on the BERT
// (Binary ERlang Term) serialization format.
// <http://bert-rpc.org/>
//
// Copyright (c) 2009 Ryan Tomayko <tomayko.com/about>
// See COPYING for licensing information.
// <http://github.com/rtomayko/node-bertrpc>
//
// TODO errors
// TODO client interface should be more node-like
// TODO better client calling interface
// TODO cast

var sys = require('sys'),
    tcp = require('tcp'),
    bert = require('./bert');

var bytes_to_int = bert.bytes_to_int,
    int_to_bytes = bert.int_to_bytes,
    t = bert.tuple,
    a = bert.atom,
    _reply = a('reply');

// exposed modules go here.
var modules = {};

var BERTRPC = {

   /* BERT-RPC SERVER IMPLEMENTATION */

   // Direct access to the modules dictionary.
   modules: modules,

   // Expose all functions in object under the given BERTPRPC module
   // name. This should be called before bertrpc.listen.
   expose: function (mod, object) {
      var funs = [];
      for (var fun in object) {
         if (typeof(object[fun]) == 'function')
            funs.push(fun);
      }
      BERTRPC.trace("SERVER", "<--", "exposing: "+mod+" [funs: "+funs.join(", ")+"]");

      modules[mod] = object;
      return object;
   },

   // Begin listing on the port and host specified.
   listen: function (port, host) {
      BERTRPC.server.listen(port, host);
   },

   // Dispatch a call or cast on an exposed module function. This is
   // called by the server when new requests are received.
   //    type: 'call' or 'cast'
   //      mod: the name of a module registered with BERTRPC.expose;
   //      fun: the name of a function defined on the module.
   //    args: arguments to fun, as an array.
   dispatch: function (type, mod, fun, args) {
      if (mod = modules[mod]) {
         if (fun = mod[fun]) {
            if (fun.apply)
               return fun.apply(mod, args);
            else
               throw 'no such fun';
         }
         else { throw 'no such fun' }
      }
      else { throw 'no such module' }
   },

   // Write a message to the console/log.
   trace: function (side, direction, message) {
      sys.puts("  " + direction + "   [" + side + "] " + message);
   },

   // The node tcp.Server object -- ready to go. Use BERTRPC.listen
   // if you just want to start a server.
   server: tcp.createServer(function (socket) {
      var trace = BERTRPC.trace;
      socket.setEncoding("binary");

      socket.addListener("connect", function () {
         trace("SERVER", "-->", "connect") });

      socket.addListener("eof", function () {
         trace("SERVER", "-->", "eof");
         socket.close();
         trace("SERVER", "<--", "close");
      });

      // read BERPs off the wire and dispatch.
      BERTRPC.read(socket, function (size, term) {
         trace("SERVER", "-->", "" + size + ": " + bert.repr(term));

         // dispatch call to module handler
         var type = term[0].toString(),
              mod = term[1].toString(),
              fun = term[2].toString(),
             args = term[3];

         var res = BERTRPC.dispatch(type, mod, fun, args);

         // encode and throw back over the wire
         var reply = t(_reply, res);
         var len = BERTRPC.write(socket, reply);
         trace("SERVER", "<--", "" + len + ": " + bert.repr(reply));
      });
   }),

   // Connect to a remote BERT-RPC service. This is the main client
   // interface.
   connect: function (port, host, callback) {
      var trace = BERTRPC.trace;
      var socket = tcp.createConnection(port, host),
      promises = [],
      client = {
         call: function (mod, fun, args, block) {
            var packet = t(a('call'), a(mod), a(fun), args),
                promise = new process.Promise();
            trace("CLIENT", "<--", bert.repr(packet));
            BERTRPC.write(socket, packet);
            promise.finish = promise.addCallback;
            if (block) { promise.finish(block) }
            promises.push(promise);
            return promise;
         },

         mod: function (mod) {
            return {
              call: function (fun, args, block) {
                return client.call(mod, fun, args, block);
              },
              fun: function (fun) {
                return function (args, block) {
                  return client.call(mod, fun, args, block);
                }
              }
            }
         },

         fun: function (mod, fun) {
           return function (args, block) {
             return client.call(mod, fun, args, block);
           }
         },

         close: function () {
           socket.close();
         }
      };

      socket.addListener("connect", function () {
         trace("CLIENT", "<--", "connected");
         callback(client);
      });

      BERTRPC.read(socket, function (size, term) {
         var reply = term[0],
             value = term[1],
             promise = promises.shift();
         trace("CLIENT", "-->", bert.repr(term));
         promise.emitSuccess(value);
      });

      socket.addListener("eof", function () {
         var promise = null;
         while (promise = promises.shift())
           promise.emitError();
      });

      return client;
   },

   // Read BERPs off the wire and call the callback provided. The
   // callback should accept size and term arguments, where size
   // is the length of the BERT packet in bytes and term is the
   // decoded object payload.
   read: function (fd, callback) {
      var size = null, buf = "";
      fd.addListener("receive", function(data) {
          buf += data;
          while (size || buf.length >= 4) {
             if (size == null) {
                // read BERP length header and adjust buffer
                size = bytes_to_int(buf, 4);
                buf = buf.substring(4);
             } else if (buf.length >= size) {
                // TODO error handling
                callback(size, bert.decode(buf.substring(0, size)));
                buf = buf.substring(size);
                size = null;
             } else {
                // nothing more we can do
                break;
             }
          }
      });
   },

   // Write the object specified by the second argument to the
   // socket or file descriptor in the first argument. This
   // BERT encodes the term and writes the result on the fd with
   // a four byte BERP length header.
   write: function (fd, term) {
      var data = bert.encode(term);
      fd.send(int_to_bytes(data.length, 4));
      fd.send(data);
      return data.length;
   }
};

process.mixin(exports, BERTRPC);

// vim: ts=2 sw=2 expandtab
