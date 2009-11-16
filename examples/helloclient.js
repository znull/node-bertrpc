var sys = require('sys'),
    rpc = require('../src/bertrpc');

// connect to the server
rpc.connect(7000, 'localhost', function (service) {
   // create a request
   var res = service.call('say', 'hello', []);
   sys.puts("client sending {call, say, hello, []}");

   res.finish(function (response) {
      sys.puts("client received: " + sys.inspect(response));
   });

   // pass a block to call to
   sys.puts("client sending {call, say, echo, ['Hello World']}");
   service.call('say', 'echo', ['Hello World'], function (result) {
       sys.puts("client received " + sys.inspect(result));
   });

   //
   var mod_say = service.mod('say');

   sys.puts("client sending {call, say, echo, [[{foo, <<'bar'>>}, {bar, <<'baz'>>}], 21]}");
   mod_say.call('echo', [{foo: 'bar', bar: 'baz'}, 21],
      function (res) {
         // the result is passed to the block
         sys.puts("client received: " + sys.inspect(res));
      }
   );

   // or, use the wait()
   /*
   var request = client.call('say', 'echo', [{foo: 'bar', bar: 'baz'}]);
   var result = request.wait();

   sys.puts('client received: ' + sys.inspect(result));
   */
   service.close();
});
