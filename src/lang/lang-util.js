var _ = require("underscore");

function RuntimeError(message, ast) {
  this.message = message;
  this.s = ast.s;
  this.e = ast.e;
};
RuntimeError.prototype = Object.create(Error.prototype);

function Meta(ast) {
  this.ast = ast;
};

var langUtil = module.exports = {
  isFunction: function(o) {
    return langUtil.isLambda(o) || langUtil.isJsFn(o);
  },

  isLambda: function(o) {
    return o !== undefined && o.bc !== undefined;
  },

  isJsFn: function(o) {
    return o instanceof Function;
  },

  hasSideEffects: function(fn) {
    fn.hasSideEffects = true;
    return fn;
  },

  internalStateBuiltin: function(state, fn) {
    fn.state = state;
    return fn;
  },

  isInternalStateBuiltin: function(o) {
    return _.isFunction(o) && o.state !== undefined;
  },

  NO_SIDE_EFFECTS: "no_side_effects",

  RuntimeError: RuntimeError,
  Meta: Meta
};
