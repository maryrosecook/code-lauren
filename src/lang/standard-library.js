var _ = require("underscore");
var im = require("immutable");

var langUtil = require("./lang-util");
var programState = require("./program-state");
var util = require("../util");
var chk = require("./check-args");
var scope = require("./scope");

function maybeUnwrapImmutableValue(item) {
  return item !== undefined && item.toJS ? item.toJS() : item;
};

var createStandardLibrary = module.exports = function () {
  var lib = im.Map({
    add: langUtil.createBuiltinNormal(function(p, a, b) {
      chk(arguments,
          chk.num("a number to add to"),
          chk.num("a number to add"));
      return { p: p, v: parseFloat(a) + parseFloat(b) };
    }),

    subtract: langUtil.createBuiltinNormal(function(p, a, b) {
      chk(arguments,
          chk.num("a number to subtract from"),
          chk.num("a number to subtract"));

      return { p: p, v: parseFloat(a) - parseFloat(b) };
    }),

    multiply: langUtil.createBuiltinNormal(function(p, a, b) {
      chk(arguments,
          chk.num("a number to multiply"),
          chk.num("a number to multiply by"));

      return { p: p, v: parseFloat(a) * parseFloat(b) };
    }),

    divide: langUtil.createBuiltinNormal(function(p, a, b) {
      chk(arguments,
          chk.num("a number to divide"),
          chk.num("a number to divide by"));

      return { p: p, v: parseFloat(a) / parseFloat(b) };
    }),

    positive: langUtil.createBuiltinNormal(function(p, a) {
      chk(arguments,
          chk.num("a number make positive"));

      return { p: p, v: Math.abs(parseFloat(a)) };
    }),

    "square-root": langUtil.createBuiltinNormal(function(p, n) {
      chk(arguments,
          chk.num("a number to get the square root of"));

      return { p: p, v: Math.sqrt(n) };
    }),

    modulus: langUtil.createBuiltinNormal(function(p, a, b) {
      chk(arguments,
          chk.num("a number to divide"),
          chk.num("a number to divide by"));

      return { p: p, v: parseFloat(a) % parseFloat(b) };
    }),

    sine: langUtil.createBuiltinNormal(function(p, x) {
      chk(arguments,
          chk.num("an angle to get the sine of"));

      return { p: p, v: Math.sin(lib.getIn(["radians", "fn"])(p, parseFloat(x)).v) };
    }),

    cosine: langUtil.createBuiltinNormal(function(p, x) {
      chk(arguments,
          chk.num("an angle to get the cosine of"));

      return { p: p, v: Math.cos(lib.getIn(["radians", "fn"])(p, parseFloat(x)).v) };
    }),

    tangent: langUtil.createBuiltinNormal(function(p, x) {
      chk(arguments,
          chk.num("an angle to get the tangent of"));

      return { p: p, v: Math.tan(lib.getIn(["radians", "fn"])(p, parseFloat(x)).v) };
    }),

    radians: langUtil.createBuiltinNormal(function(p, x) {
      chk(arguments,
          chk.num("an angle to convert to radians"));

      return { p: p, v: 0.01745 * parseFloat(x) };
    }),

    degrees: langUtil.createBuiltinNormal(function(p, x) {
      chk(arguments,
          chk.num("a number to convert from radians to degrees"));

      return { p: p, v: parseFloat(x) / 0.01745 };
    }),

    "thing": langUtil.createBuiltinNormal(function(p) {
      return { p: p, v: im.Map() };
    }),

    "less-than": langUtil.createBuiltinNormal(function(p, a, b) {
      chk(arguments,
          chk.num("a number"),
          chk.num("a number to compare"));

      return { p: p, v: parseFloat(a) < parseFloat(b) };
    }),

    "more-than": langUtil.createBuiltinNormal(function(p, a, b) {
      chk(arguments,
          chk.num("a number"),
          chk.num("a number to compare"));

      return { p: p, v: parseFloat(a) > parseFloat(b) };
    }),

    equal: langUtil.createBuiltinNormal(function(p, a, b) {
      chk(arguments,
          chk.numOrBooleanOrString("a number or a piece of text"),
          chk.numOrBooleanOrString("a number or a piece of text to compare"));

      return { p: p, v: a == b };
    }),

    opposite: langUtil.createBuiltinNormal(function(p, o) {
      chk(arguments,
          chk.numOrBoolean("a number or true or false"));

      if (_.isBoolean(o)) {
        return { p: p, v: !o };
      } else if (_.isNumber(o)) {
        return { p: p, v: -o };
      }
    }),

    "random-number": langUtil.createBuiltinNormal(function(p, a, b) {
      chk(arguments,
          chk.num("a lowest possible random number"),
          [chk.num("a highest possible random number"),
           chk.range(a,
                     undefined,
                     "the highest possible random number.  Should be equal to or higher than " +
                       a +
                       ", the lowest possible number you gave.")]);

      return { p: p, v: Math.round(Math.random() * (b - a)) + a };
    }),

    set: langUtil.createBuiltinMutating(function(p, obj, key, value) {
      chk(arguments,
          chk.thing("a thing to set some information on"),
          chk.string("the name of the information to set"),
          chk.numOrBooleanOrString("the information to set"));

      var varName = p.get("currentInstruction").ast.c[1].c;
      var value = obj.set(key, value);
      p = p.set("scopes", scope.setGlobalBinding(p.get("scopes"),
                                                 programState.currentScopeId(p),
                                                 varName,
                                                 value));

      return { v: value, p: p };
    }),

    get: langUtil.createBuiltinNormal(function(p, obj, key) {
      return { p: p, v: obj.get(key) };
    }),

    print: langUtil.createBuiltinOutputting(
      function(p, itemToPrint) {
        chk(arguments,
            chk.defined("something to print"));

        console.log(maybeUnwrapImmutableValue(itemToPrint));
        return { p: p, v: itemToPrint + "\n" };
      }),

    counted: langUtil.createBuiltinInternalState(im.Map(), function(p, target) {
      chk(arguments,
          [chk.num("a number to count to that is more than 0"),
           chk.range(1, undefined, "a number to count that is more than 0")]);

      function counted(state, lineNumber) {
        if (state.get(lineNumber) === undefined) {
          state = state.set(lineNumber, im.Map({ count: 0, target: parseInt(target) }));
        }

        state = state.updateIn([lineNumber, "count"], util.inc);

        if (state.getIn([lineNumber, "count"]) === state.getIn([lineNumber, "target"])) {
          state = state.setIn([lineNumber, "count"], 0);
          return { v: true, state: state };
        } else {
          return { v: false, state: state };
        }
      };

      var fnObj = p.get("stack").peek().v;
      var state = fnObj.get("state");
      var ast = p.get("currentInstruction").ast;
      var lineNumber = ast.s;
      var vAndState = counted(state, lineNumber);

      return {
        p: p.setIn(["scopes", 0, "bindings", "counted", "state"], vAndState.state),
        v: vAndState.v
      };
    })
  });

  return lib;
};
