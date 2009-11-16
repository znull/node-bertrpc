var   sys = require('sys'),
      rpc = require('../src/bertrpc');

rpc.expose('say', {
   hello: function(what) {
      return "hello";
   },

   echo: function() {
      var args = [];
      for ( var i = 0; i < arguments.length; i++ )
         args[i] = arguments[i];
      return args;
   }
});

rpc.listen(7000, 'localhost');
