var sys = require('sys');

TEST = {
   passed: 0,
   failed: 0,
   assertions: 0,

   test: function (desc, block) {
      var _puts  = sys.puts,
          output = "",
          result = '?',
          _boom = null;
      sys.puts = function (s) { output += s + "\n"; }
      try {
         sys.print("  " + desc + " ...");
         block();
         result = '.';
      } catch(boom) {
         if ( boom == 'FAIL' ) {
            result = 'F';
         } else {
            result = 'E';
            _boom = boom;
         }
      }
      sys.puts = _puts;
      if ( result == '.' ) {
         sys.print(" OK\n");
         TEST.passed += 1;
      } else {
         sys.print(" FAIL\n");
         sys.print(output.replace(/^/, "      ") + "\n");
         TEST.failed += 1;
         if ( _boom )  throw _boom;
      }
   },

   assert: function (value, desc) {
      TEST.assertions += 1;
      if ( desc ) sys.puts(desc);
      if ( !value ) throw 'FAIL';
   },

   assert_equal: function (expect, is) {
      assert(expect == is, expect.toString() + " == " + is.toString());
   }
};

process.mixin(exports, TEST);

process.addListener('exit', function (code) {
   if ( !TEST.exit ) {
      TEST.exit = true;
      sys.puts("" + TEST.passed + " passed, " + TEST.failed + " failed");
      if ( TEST.failed > 0 ) { process.exit(1) };
   }
});
