var sys = require('sys'),
    rpc = require('../src/bertrpc');

// connect to the server
rpc.connect(7000, 'localhost', function (service) {

   // call the echo module's hello function with no arguments
   var res = service.call('echo', 'hello', []);
   sys.debug("client sending {call, say, hello, []}");

   // the call return comes back asynchronously
   res.finish(function (result) {
      sys.debug("client received: " + sys.inspect(result));
   });

   // call the echo module's echo function with a simple string
   // argument and provide the finish callback to the call method
   // instead of registering it on the resulting promise:
   sys.debug("client sending {call, say, echo, ['Hello World']}");
   service.call('echo', 'echo', ['Hello World'], function (result) {
       sys.debug("client received " + sys.inspect(result));
   });

   // grab the echo module object so that we can call on it without
   // specifying the module name.
   var echo_module = service.mod('echo');

   // pass dict and integer args this time to make things a bit more
   // interesting.
   sys.debug("client sending {call, say, echo, [[{foo, <<'bar'>>}, {bar, <<'baz'>>}], 21]}");
   echo_module.call('echo', [{foo: 'bar', bar: 'baz'}, 21], function (result) {
      sys.debug("client received: " + sys.inspect(result));
   });

   sys.debug("client closing connection");
   service.close();
});
