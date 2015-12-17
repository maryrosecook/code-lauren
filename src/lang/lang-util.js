var _ = require("underscore");
var im = require("immutable");

function RuntimeError(message, ast) {
  this.message = message;
  this.s = ast.s;
  this.e = ast.e;
};
RuntimeError.prototype = Object.create(Error.prototype);

function Meta(ast, state) {
  this.ast = ast;
  this.state = state;
};

var LAMBDA = "lambda";
var BUILTIN_NORMAL = "builtin_normal";
var BUILTIN_INTERNAL_STATE = "builtin_internal_state";
var BUILTIN_OUTPUTTING = "builtin_outputting";
var BUILTIN_MUTATING = "builtin_mutating";

var INVOKABLE_BUILTIN_TYPES = [BUILTIN_NORMAL, BUILTIN_INTERNAL_STATE,
                               BUILTIN_OUTPUTTING, BUILTIN_MUTATING];
var INVOKABLE_TYPES = [LAMBDA].concat(INVOKABLE_BUILTIN_TYPES);

var langUtil = module.exports = {
  createBuiltinNormal: function(fn) {
    if (fn instanceof Function) {
      return im.Map({ type: BUILTIN_NORMAL, fn: fn });
    } else {
      throw new Error("Function for builtin is not a JS function.");
    }
  },

  createLambda: function(bc, parameters) {
    if (bc != null && parameters != null) {
      return im.Map({ type: LAMBDA, bc: bc, parameters: parameters });
    } else {
      throw new Error("Lambda is missing bytecode, parameters or both.");
    }
  },

  createBuiltinInternalState: function(state, fn) {
    if (state != null && fn instanceof Function) {
      return im.Map({ type: BUILTIN_INTERNAL_STATE, fn: fn, state: state });
    } else {
      throw new Error("Function for builtin is not a JS function.");
    }
  },

  createBuiltinOutputting: function(fn) {
    if (fn instanceof Function) {
      return im.Map({ type: BUILTIN_OUTPUTTING, fn: fn });
    } else {
      throw new Error("Function for builtin is not a JS function.");
    }
  },

  createBuiltinMutating: function(fn) {
    if (fn instanceof Function) {
      return im.Map({ type: BUILTIN_MUTATING, fn: fn });
    } else {
      throw new Error("Function for builtin is not a JS function.");
    }
  },

  isInvokable: function(o) {
    return o != null && o instanceof im.Map && INVOKABLE_TYPES.indexOf(o.get("type")) !== -1;
  },

  isLambda: function(o) {
    return langUtil.isInvokable(o) && o.get("type") === LAMBDA;
  },

  isBuiltin: function(o) {
    return langUtil.isInvokable(o) && INVOKABLE_BUILTIN_TYPES.indexOf(o.get("type")) !== -1;
  },

  isBuiltinNormal: function(o) {
    return langUtil.isInvokable(o) && o.get("type") === BUILTIN_NORMAL;
  },

  isBuiltinOutputting: function(o) {
    return langUtil.isInvokable(o) && o.get("type") === BUILTIN_OUTPUTTING;
  },

  isBuiltinInternalState: function(o) {
    return langUtil.isInvokable(o) && o.get("type") === BUILTIN_INTERNAL_STATE;
  },

  isBuiltinMutating: function(o) {
    return langUtil.isInvokable(o) && o.get("type") === BUILTIN_MUTATING;
  },

  NO_OUTPUTTING: "no_outputting",

  RuntimeError: RuntimeError,
  Meta: Meta
};
