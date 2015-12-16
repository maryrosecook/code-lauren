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

var langUtil = module.exports = {
  isFunction: function(o) {
    return langUtil.isLambda(o) || langUtil.isBuiltin(o);
  },

  isLambda: function(o) {
    return o !== undefined && o.bc !== undefined;
  },

  isBuiltin: function(o) {
    return o instanceof Function || langUtil.isInternalStateFn(o);
  },

  setIsOutputting: function(fn) {
    fn.isOutputting = true;
    return fn;
  },

  isOutputting: function(o) {
    var fn = langUtil.isInternalStateFn(o) ? o.get("fn") : o;
    return fn.isOutputting === true;
  },

  createInternalStateFn: function(state, fn) {
    return im.Map({
      state: state,
      fn: fn
    });
  },

  isInternalStateFn: function(o) {
    return o !== undefined &&
      o.get !== undefined &&
      o.get("state") !== undefined &&
      o.get("fn") !== undefined;
  },

  NO_OUTPUTTING: "no_outputting",

  RuntimeError: RuntimeError,
  Meta: Meta
};
