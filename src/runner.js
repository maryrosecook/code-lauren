var lang = require("./lang/ben/interpreter");

function start(code, env) {
  try {
    var ast = lang.parse(code);
  } catch(e) {
    throw new ParseError(e);
  }

  return lang.interpret(ast, env);
};

function complete(g) {
  var result = g.next();
  if (result.done === true) {
    return result.value;
  } else {
    return complete(g);
  }
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
