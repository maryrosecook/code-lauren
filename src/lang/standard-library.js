var _ = require("underscore");
var langUtil = require("./lang-util");
var chk = require("./check-args");

var createStandardLibrary = module.exports = function () {
  var lib = {
    add: function(meta, a, b) {
      chk(arguments,
          chk.num("Missing two numbers"),
          chk.num("Missing a number to add"));
      return parseFloat(a) + parseFloat(b);
    },

    subtract: function(meta, a, b) {
      chk(arguments,
          chk.num("Missing two numbers"),
          chk.num("Missing a number to subtract"));

      return a - b;
    },

    multiply: function(meta, a, b) {
      chk(arguments,
          chk.num("Missing two numbers to multiply"),
          chk.num("Missing a number to multiply by"));

      return a * b;
    },

    divide: function(meta, a, b) {
      chk(arguments,
          chk.num("Missing a number to divide and a number to divide by"),
          chk.num("Missing a number to divide by"));

      return a / b;
    },

    modulus: function(meta, a, b) {
      chk(arguments,
          chk.num("Missing a number to divide and a number to divide by"),
          chk.num("Missing a number to divide by"));

      return a % b;
    },

    sine: function(meta, x) {
      chk(arguments,
          chk.num("Missing an angle to get the sine of"));

      return Math.sin(lib.radians(meta, x));
    },

    cosine: function(meta, x) {
      chk(arguments,
          chk.num("Missing an angle to get the cosine of"));

      return Math.cos(lib.radians(meta, x));
    },

    tangent: function(meta, x) {
      chk(arguments,
          chk.num("Missing an angle to get the tangent of"));

      return Math.tan(lib.radians(meta, x));
    },

    radians: function(meta, x) {
      chk(arguments,
          chk.num("Missing an angle to convert to radians"));

      return 0.01745 * x;
    },

    degrees: function(meta, x) {
      chk(arguments,
          chk.num("Missing some radians to convert to degrees"));

      return x / 0.01745;
    },

    "new-dictionary": function(meta) {
      var args = _.rest(arguments);
      return _.object(_.filter(args, function(_, i) { return i % 2 === 0; }),
                      _.filter(args, function(_, i) { return i % 2 === 1; }));
    },

    "less-than": function(meta, a, b) {
      chk(arguments,
          chk.num("Missing two numbers"),
          chk.num("Missing a second number"));

      return a < b;
    },

    "greater-than": function(meta, a, b) {
      chk(arguments,
          chk.num("Missing two numbers"),
          chk.num("Missing a second number"));

      return a > b;
    },

    equal: function(meta, a, b) {
      chk(arguments,
          chk.num("Missing two numbers"),
          chk.num("Missing a second number"));

      return a === b;
    },

    set: function(meta, dict, key, value) {
      dict[key] = value;
      return dict;
    },

    get: function(meta, dict, key) {
      return dict[key];
    },

    print: langUtil.hasSideEffects(
      function(meta, itemToPrint) {
        chk(arguments,
            chk.any("something to print"));

        console.log(itemToPrint);
        return itemToPrint + "\n";
      }),

    counters: [],
    counted: function(meta, target) {
      chk(arguments,
          chk.num("Missing a number to count to"));

      var counter = lib.counters[meta.ast.s];
      if (counter === undefined) {
        counter = lib.counters[meta.ast.s] = { count: 0, target: target };
      }

      counter.count++;

      if (counter.count === counter.target) {
        counter.count = 0;
        return true;
      } else {
        return false;
      }
    }
  };

  return lib;
};
