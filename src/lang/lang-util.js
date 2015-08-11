var _ = require("underscore");

function RuntimeError(message, ast) {
  this.message = message;
  this.s = ast.s;
  this.e = ast.e;
};
RuntimeError.prototype = Object.create(Error.prototype);

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

  RuntimeError: RuntimeError
};
