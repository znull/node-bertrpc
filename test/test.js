var sys = require('sys');

TEST = {
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
      } else {
         sys.print(" FAIL\n");
         sys.print(output.replace(/^/, "      ") + "\n");
         if ( _boom )  throw _boom;
      }
   },

   assert: function (value, desc) {
      if ( desc ) sys.puts(desc);
      if ( !value ) throw 'FAIL';
   },

   assert_equal: function (expect, is) {
      assert(expect == is, expect.toString() + " == " + is.toString());
   },

   it: function (desc, value) {
      TEST.assert(value, desc);
   }
};

process.mixin(exports, TEST);
