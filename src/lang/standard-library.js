var _ = require("underscore");
var langUtil = require("./lang-util");
var util = require("../util");
var chk = require("./check-args");
var im = require("immutable");

var createStandardLibrary = module.exports = function () {
  var lib = im.Map({
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

      return parseFloat(a) - parseFloat(b);
    },

    multiply: function(meta, a, b) {
      chk(arguments,
          chk.num("Missing two numbers to multiply"),
          chk.num("Missing a number to multiply by"));

      return parseFloat(a) * parseFloat(b);
    },

    divide: function(meta, a, b) {
      chk(arguments,
          chk.num("Missing a number to divide and a number to divide by"),
          chk.num("Missing a number to divide by"));

      return parseFloat(a) / parseFloat(b);
    },

    modulus: function(meta, a, b) {
      chk(arguments,
          chk.num("Missing a number to divide and a number to divide by"),
          chk.num("Missing a number to divide by"));

      return parseFloat(a) % parseFloat(b);
    },

    sine: function(meta, x) {
      chk(arguments,
          chk.num("Missing an angle to get the sine of"));

      return Math.sin(lib.get("radians")(meta, parseFloat(x)));
    },

    cosine: function(meta, x) {
      chk(arguments,
          chk.num("Missing an angle to get the cosine of"));

      return Math.cos(lib.get("radians")(meta, parseFloat(x)));
    },

    tangent: function(meta, x) {
      chk(arguments,
          chk.num("Missing an angle to get the tangent of"));

      return Math.tan(lib.get("radians")(meta, parseFloat(x)));
    },

    radians: function(meta, x) {
      chk(arguments,
          chk.num("Missing an angle to convert to radians"));

      return 0.01745 * parseFloat(x);
    },

    degrees: function(meta, x) {
      chk(arguments,
          chk.num("Missing some radians to convert to degrees"));

      return parseFloat(x) / 0.01745;
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

      return parseFloat(a) < parseFloat(b);
    },

    "more-than": function(meta, a, b) {
      chk(arguments,
          chk.num("Missing two numbers"),
          chk.num("Missing a second number"));

      return parseFloat(a) > parseFloat(b);
    },

    equal: function(meta, a, b) {
      chk(arguments,
          chk.num("Missing two numbers"),
          chk.num("Missing a second number"));

      return a == b;
    },

    set: function(meta, dict, key, value) {
      dict[key] = value;
      return dict;
    },

    get: function(meta, dict, key) {
      return dict[key];
    },

    print: langUtil.setSideEffecting(
      function(meta, itemToPrint) {
        chk(arguments,
            chk.any("Missing something to print"));

        console.log(itemToPrint);
        return itemToPrint + "\n";
      }),

    counted: langUtil.createInternalStateFn(im.Map(), function(meta, target) {
      chk(arguments,
          [chk.num("Missing a number to count to"),
           chk.range(1, undefined, "Number to count to must be more than 0")]);

      if (meta.state.get(meta.ast.s) === undefined) {
        meta.state = meta.state.set(meta.ast.s, im.Map({ count: 0, target: parseInt(target) }));
      }

      meta.state = meta.state.updateIn([meta.ast.s, "count"], util.inc);

      if (meta.state.getIn([meta.ast.s, "count"]) === meta.state.getIn([meta.ast.s, "target"])) {
        meta.state = meta.state.setIn([meta.ast.s, "count"], 0);
        return { v: true, state: meta.state };
      } else {
        return { v: false, state: meta.state };
      }
    })
  });

  return lib;
};
