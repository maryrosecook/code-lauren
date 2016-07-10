var _ = require("underscore");
var langUtil = require("./lang-util");
var util = require("../util");
var chk = require("./check-args");
var im = require("immutable");

function maybeUnwrapImmutableValue(item) {
  return item !== undefined && item.toJS ? item.toJS() : item;
};

var createStandardLibrary = module.exports = function () {
  var lib = im.Map({
    add: langUtil.createBuiltinNormal(function(meta, a, b) {
      chk(arguments,
          chk.num("a number to add to"),
          chk.num("a number to add"));
      return parseFloat(a) + parseFloat(b);
    }),

    subtract: langUtil.createBuiltinNormal(function(meta, a, b) {
      chk(arguments,
          chk.num("a number to subtract from"),
          chk.num("a number to subtract"));

      return parseFloat(a) - parseFloat(b);
    }),

    multiply: langUtil.createBuiltinNormal(function(meta, a, b) {
      chk(arguments,
          chk.num("a number to multiply"),
          chk.num("a number to multiply by"));

      return parseFloat(a) * parseFloat(b);
    }),

    divide: langUtil.createBuiltinNormal(function(meta, a, b) {
      chk(arguments,
          chk.num("a number to divide"),
          chk.num("a number to divide by"));

      return parseFloat(a) / parseFloat(b);
    }),

    positive: langUtil.createBuiltinNormal(function(meta, a) {
      chk(arguments,
          chk.num("a number make positive"));

      return Math.abs(parseFloat(a));
    }),

    "square-root": langUtil.createBuiltinNormal(function(meta, n) {
      chk(arguments,
          chk.num("a number to get the square root of"));

      return Math.sqrt(n);
    }),

    modulus: langUtil.createBuiltinNormal(function(meta, a, b) {
      chk(arguments,
          chk.num("a number to divide"),
          chk.num("a number to divide by"));

      return parseFloat(a) % parseFloat(b);
    }),

    sine: langUtil.createBuiltinNormal(function(meta, x) {
      chk(arguments,
          chk.num("an angle to get the sine of"));

      return Math.sin(lib.getIn(["radians", "fn"])(meta, parseFloat(x)));
    }),

    cosine: langUtil.createBuiltinNormal(function(meta, x) {
      chk(arguments,
          chk.num("an angle to get the cosine of"));

      return Math.cos(lib.getIn(["radians", "fn"])(meta, parseFloat(x)));
    }),

    tangent: langUtil.createBuiltinNormal(function(meta, x) {
      chk(arguments,
          chk.num("an angle to get the tangent of"));

      return Math.tan(lib.getIn(["radians", "fn"])(meta, parseFloat(x)));
    }),

    radians: langUtil.createBuiltinNormal(function(meta, x) {
      chk(arguments,
          chk.num("an angle to convert to radians"));

      return 0.01745 * parseFloat(x);
    }),

    degrees: langUtil.createBuiltinNormal(function(meta, x) {
      chk(arguments,
          chk.num("a number to convert from radians to degrees"));

      return parseFloat(x) / 0.01745;
    }),

    "thing": langUtil.createBuiltinNormal(function(meta) {
      return im.Map();
    }),

    "less-than": langUtil.createBuiltinNormal(function(meta, a, b) {
      chk(arguments,
          chk.num("a number"),
          chk.num("a number to compare"));

      return parseFloat(a) < parseFloat(b);
    }),

    "more-than": langUtil.createBuiltinNormal(function(meta, a, b) {
      chk(arguments,
          chk.num("a number"),
          chk.num("a number to compare"));

      return parseFloat(a) > parseFloat(b);
    }),

    equal: langUtil.createBuiltinNormal(function(meta, a, b) {
      chk(arguments,
          chk.numOrBooleanOrString("a number or a piece of text"),
          chk.numOrBooleanOrString("a number or a piece of text to compare"));

      return a == b;
    }),

    opposite: langUtil.createBuiltinNormal(function(meta, o) {
      chk(arguments,
          chk.numOrBoolean("a number or true or false"));

      if (_.isBoolean(o)) {
        return !o;
      } else if (_.isNumber(o)) {
        return -o;
      }
    }),

    "random-number": langUtil.createBuiltinNormal(function(meta, a, b) {
      chk(arguments,
          chk.num("a lowest possible random number"),
          [chk.num("a highest possible random number"),
           chk.range(a,
                     undefined,
                     "the highest possible random number.  Should be equal to or higher than " +
                       a +
                       ", the lowest possible number you gave.")]);

      return Math.round(Math.random() * (b - a)) + a;
    }),

    set: langUtil.createBuiltinMutating(function(meta, obj, key, value) {
      chk(arguments,
          chk.thing("a thing to set some information on"),
          chk.string("the name of the information to set"),
          chk.numOrBooleanOrString("the information to set"));

      return obj.set(key, value);
    }),

    get: langUtil.createBuiltinNormal(function(meta, obj, key) {
      return obj.get(key);
    }),

    print: langUtil.createBuiltinOutputting(
      function(meta, itemToPrint) {
        chk(arguments,
            chk.defined("something to print"));

        console.log(maybeUnwrapImmutableValue(itemToPrint));
        return itemToPrint + "\n";
      }),

    counted: langUtil.createBuiltinInternalState(im.Map(), function(meta, target) {
      chk(arguments,
          [chk.num("a number to count to that is more than 0"),
           chk.range(1, undefined, "a number to count that is more than 0")]);

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
