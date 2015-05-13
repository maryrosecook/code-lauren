var parse = require("./lang/parser");
var interpret = require("./lang/interpreter");

function start(code, env) {
  try {
    var ast = parse(code);
  } catch(e) {
    throw new ParseError(e);
  }

  return interpret(ast, env);
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
  for (var i in from) {
    to[i] = from[i];
  }
};

start.ParseError = ParseError;
start.RuntimeError = RuntimeError;
start.DoneError = DoneError;
start.complete = complete;
start.step = step;
module.exports = start;
