var util = require('util');

TEST = {
   passed: 0,
   failed: 0,
   assertions: 0,

   test: function (desc, block) {
      var _puts  = util.puts,
          output = "",
          result = '?',
          _boom = null;
      util.puts = function (s) { output += s + "\n"; }
      try {
         util.print("  " + desc + " ...");
         block();
         result = '.';
      } catch(boom) {
         if ( boom == 'FAIL' ) {
            result = 'F';
         } else {
            result = 'E';
            _boom = boom;
            util.puts(boom.toString());
         }
      }
      util.puts = _puts;
      if ( result == '.' ) {
         util.print(" OK\n");
         TEST.passed += 1;
      } else {
         util.print(" FAIL\n");
         util.print(output.replace(/^/, "      ") + "\n");
         TEST.failed += 1;
         if ( _boom ) throw _boom;
      }
   },

   assert: function (value, desc) {
      TEST.assertions += 1;
      if ( desc ) util.puts("ASSERT: " + desc);
      if ( !value ) throw 'FAIL';
   },

   assert_equal: function (expect, is) {
      assert(
         expect == is,
         util.inspect(expect) + " == " + util.inspect(is)
      );
   },

   assert_boom: function (message, block) {
      var error = null;
      try { block() }
      catch (boom) { error = boom }

      if ( !error ) {
         util.puts('NO BOOM');
         throw 'FAIL'
      }
      if ( error != message ) {
         util.puts('BOOM: ' + util.inspect(error) +
                  ' [' + util.inspect(message) + ' expected]');
         throw 'FAIL'
      }
   }
};

process.mixin(exports, TEST);

process.addListener('exit', function (code) {
   if ( !TEST.exit ) {
      TEST.exit = true;
      util.puts("" + TEST.passed + " passed, " + TEST.failed + " failed");
      if ( TEST.failed > 0 ) { process.exit(1) };
   }
});
