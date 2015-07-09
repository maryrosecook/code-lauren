var createScope = require("./lang/scope");
var compiler = require("./lang/compiler");
var vm = require("./lang/vm");
var _ = require("underscore");

function copyProgramState(o) {
  return {
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
  } else if (o !== undefined && o.parent === undefined) { // at lib so reuse don't copy
    return o;
  } else if (o !== undefined && o.parent !== undefined) {
    return createScope(copyValue(o.bindings, visited), copyEnv(o.parent, visited));
  }
};

// copies any value in the language
function copyValue(o, visited) {
  if (visited === undefined) {
    return copyValue(o, []);
  } else if (visited.indexOf(o) !== -1) {
    return visited[visited.indexOf(o)];
  } else {
    visited.push(o);

    if (_.isString(o) || _.isNumber(o) || _.isBoolean(o) || _.isFunction(o)) {
      return o;
    } else if (isLambda(o)) {
      return { bc: o.bc, parameters: o.parameters, closureEnv: copyEnv(o.closureEnv, visited) };
    } else if (_.isObject(o)) {
      return Object.keys(o)
        .reduce(function(c, k) {
          c[k] = copyValue(o[k], visited);
          return c;
        }, {});
    } else if (_.isArray(o)) {
      return o.map(function() { return copyValue(o, visited); });
    } else if (o !== undefined) {
      throw "Got value to copy that didn't match any cases: " + o;
    }
  }
};

function isLambda(o) {
  return o !== undefined &&
    o.bc !== undefined && o.parameters !== undefined && o.closureEnv !== undefined;
};

copyProgramState.copyProgramState = copyProgramState;
copyProgramState.copyEnv = copyEnv;
copyProgramState.copyValue = copyValue;
module.exports = copyProgramState;
