var sys = require('sys'),
    rpc = require('../src/bertrpc');

// connect to the server
rpc.connect(7001, 'localhost', function (service) {
   // grab the math module object so that we can call on it without
   // specifying the module name.
   var mathrpc = service.mod('math');

   // call the math module's sum function with a few integers
   // and print the result
   sys.debug("math client summing [1, 2, 3]");
   mathrpc.call('sum', [[1, 2, 3]], function (result) {
       sys.debug("math client got: " + sys.inspect(result));
   });

   // calculate a fibonacci number and pass the result to
   // the callback provided.
   var fib = function (num, callback) {
     if ( num == 1 ) {
       callback(0);
     } else if ( num == 2 ) {
       callback(1)
     } else {
       fib(num - 1, function(n1) {
         fib(num - 2, function(n2) {
           mathrpc.call('sum', [[n1, n2]], callback);
         });
       });
     }
   }

   // calculate the 25th fibonacci number
   fib(25, function (number) {
     sys.debug("the 25th fibonacci number is " + number);
   });
});
