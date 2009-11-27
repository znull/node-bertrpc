var   sys = require('sys'),
      rpc = require('../src/bertrpc');

rpc.expose('echo', {
   // return 'hello' no matter what
   hello: function(what) {
      return "hello";
   },

   // return arguments exactly as provided
   echo: function() {
      var args = [];
      for ( var i = 0; i < arguments.length; i++ )
         args[i] = arguments[i];
      return args;
   }
});

rpc.listen(7000, 'localhost');
