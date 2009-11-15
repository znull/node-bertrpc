var   sys = require('sys'),
      rpc = require('../bertrpc');

rpc.expose('say', {
    hello: function(what) {
      return "Hello " + what;
    }
});

rpc.listen(7000, 'localhost');
