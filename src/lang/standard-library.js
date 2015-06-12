var _ = require("underscore");
var interpreter = require("./interpreter");

var createStandardLibrary = module.exports = function () {
  var lib = {
    add: function() {
      return _.reduce(arguments, function(a, n) { return a + n; });
    },

    subtract: function() {
      return _.reduce(arguments, function(a, n) { return a - n; });
    },

    multiply: function() {
      return _.reduce(arguments, function(a, n) { return a * n; });
    },

    sine: function(x) {
      return Math.sin(lib.radians(x).next().value);
    },

    cosine: function(x) {
      return Math.cos(lib.radians(x).next().value);
    },

    tangent: function(x) {
      return Math.tan(lib.radians(x).next().value);
    },

    radians: function(x) {
      return 0.01745 * x;
    },

    degrees: function(x) {
      return x / 0.01745;
    },

    "new-dictionary": function() {
      return _.object(_.filter(arguments, function(_, i) { return i % 2 === 0; }),
                      _.filter(arguments, function(_, i) { return i % 2 === 1; }));
    },

    "less-than": function(a, b) {
      return a < b;
    },

    "greater-than": function(a, b) {
      return a > b;
    },

    equals: function() {
      var args = _.toArray(arguments);
      if (args.length < 2 || args[0] !== args[1]) {
        return false;
      } else if (args.length === 2) {
        return true;
      } else {
        return lib.equals.apply(null, args.slice(1));
      }
    },

    set: function(dict, key, value) {
      dict[key] = value;
      return dict;
    },

    get: function(dict, key) {
      return dict[key];
    },

    print: function(printable) {
      var output = _.map(arguments, function(x) { return x.toString(); }).join(" ");
      console.log(output);
      return output + "\n";
    },

    forever: function(fn) {
      throw "broken for now until trampolining brought back!"
      // while (true) {
      //   yield* require("./interpreter").trampoline(yield* fn());
      // }
    }
  };

  return lib;
};
