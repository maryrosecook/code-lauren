var createScope = require("./lang/scope");
var compiler = require("./lang/compiler");
var vm = require("./lang/vm");
var langUtil = require("./lang/lang-util");
var _ = require("underscore");

function copyProgramState(o) {
  return {
    crashed: o.crashed,
    code: o.code,
    callStack: copyCallStack(o.callStack),
    stack: copyStack(o.stack),
    currentInstruction: o.currentInstruction,
    canvasLib: o.canvasLib
  };
};

function copyCallStack(o) {
  return o
    .map(function(c) { return vm.createCallFrame(c.bc, c.bcPointer, copyEnv(c.env), c.tail); });
};

function copyStack(o) {
  return o.map(function(v) { return v; });
};

function copyEnv(o, visited) {
  if (visited === undefined) {
    return copyEnv(o, []);
  } else if (o !== undefined && o.parent === undefined) {
    return createScope(copyValue(o.bindings, visited));
  } else if (o.parent !== undefined) { // at lib so reuse don't copy
    return createScope(copyValue(o.bindings, visited), copyEnv(o.parent, visited));
  }
};

// copies any value in the language
function copyValue(o, visited) {
  if (visited === undefined) {
    return copyValue(o, []);
  } else if (visited.indexOf(o) !== -1) {
    return visited[visited.indexOf(o)];
  } else if (_.isString(o) || _.isNumber(o) || _.isBoolean(o) ||
             (_.isFunction(o) && !langUtil.isInternalStateBuiltin(o))) {
    return o;
  } else {
    visited.push(o);

    if (langUtil.isInternalStateBuiltin(o)) {
      return copyInternalStateBuiltin(o);
    } else if (langUtil.isLambda(o)) {
      return { bc: o.bc, parameters: o.parameters, closureEnv: copyEnv(o.closureEnv, visited) };
    } else if (_.isArray(o)) {
      return o.map(function() { return copyValue(o, visited); });
    } else if (_.isObject(o)) {
      return Object.keys(o)
        .reduce(function(c, k) {
          c[k] = copyValue(o[k], visited);
          return c;
        }, {});
    } else if (o !== undefined) {
      throw "Got value to copy that didn't match any cases: " + o;
    }
  }
};

function copyInternalStateBuiltin(o) {
  // Gross! Done to match .length of clone to .length of o
  switch(o.length) {
    case 0: function c() { return o.apply(c, arguments); }; break;
    case 1: function c(_a) { return o.apply(c, arguments); }; break;
    case 2: function c(_a, _b) { return o.apply(c, arguments); }; break;
    case 3: function c(_a, _b, _c) { return o.apply(c, arguments); }; break;
    case 4: function c(_a, _b, _c, _d) { return o.apply(c, arguments); }; break;
    case 5: function c(_a, _b, _c, _d, _e) { return o.apply(c, arguments); }; break;
    case 6: function c(_a, _b, _c, _d, _e, _f) { return o.apply(c, arguments); }; break;
    case 7: function c(_a, _b, _c, _d, _e, _f, _g) { return o.apply(c, arguments); }; break;
    case 8: function c(_a, _b, _c, _d, _e, _f, _g, _h) { return o.apply(c, arguments); }; break;
    case 9: function c(_a, _b, _c, _d, _e, _f, _g, _h, _i) { return o.apply(c, arguments); }; break;
  }

  c.state = copyValue(o.state);
  return c;
};

copyProgramState.copyProgramState = copyProgramState;
copyProgramState.copyEnv = copyEnv;
copyProgramState.copyValue = copyValue;
module.exports = copyProgramState;
