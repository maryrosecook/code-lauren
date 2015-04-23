var lang = require("./lang/interpreter");

function start(code, env) {
  try {
    var ast = lang.parse(code);
  } catch(e) {
    throw new ParseError(e);
  }

  return lang.trampoline(lang.interpret(ast, env).next().value);
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

function isDone(value) {
  return value instanceof Function;
};

function ParseError(e) {
  copyException(e, this);
};
ParseError.prototype = new Error();

function RuntimeError(e) {
  copyException(e, this);
};
RuntimeError.prototype = new Error();

function DoneError(e) {
  copyException(e, this);
};
DoneError.prototype = new Error();

function copyException(from, to) {
  to.stack = from.stack;
  to.message = from.message;
};

start.ParseError = ParseError;
start.RuntimeError = RuntimeError;
start.DoneError = DoneError;
start.complete = complete;
start.step = step;
module.exports = start;
