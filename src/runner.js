var util = require("./util");
var parse = require("./lang/parser");
var interpret = require("./lang/interpreter");

function start(code, env) {
  return interpret(parse(code), env);
};

function complete(g) {
  var result = g.next();
  while (result.done !== true) {
    result = g.next();
  }

  return result.value
};

function step(g) {
  return g.next().value;
};

function RuntimeError(e) {
  util.copyException(e, this);
};
RuntimeError.prototype = new Error();

function DoneError(e) {
  util.copyException(e, this);
};
DoneError.prototype = new Error();

start.RuntimeError = RuntimeError;
start.DoneError = DoneError;
start.complete = complete;
start.step = step;
module.exports = start;
