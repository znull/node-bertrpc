var   sys = require('sys'),
      rpc = require('../src/bertrpc');

rpc.expose('math', {
    sum: function(values) {
      var res = 0;
      for(var i = 0; i < values.length; i++)
          res += values[i];
      return res;
    },

    avg: function(values) {
      return this.sum(values) / values.length;
    }
});

rpc.listen(7000, 'localhost');
