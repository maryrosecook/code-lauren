var lang = require("./lang/ben/interpreter");

function runnable(code, env) {
  try {
    var ast = lang.parse(code);
  } catch(e) {
    throw new ParseError(e);
  }

  return {
    lastResult: lang.interpret(ast, env)
  }
};

function step(runnable) {
  if (isDone(runnable)) {
    throw new DoneError("Runnable is done");
  }

  try {
    runnable.lastResult = lang.interpret(runnable.lastResult);
    return runnable;
  } catch(e) {
    throw new RuntimeError(e);
  }
};

function isDone(runnable) {
  return true; // temp
};

function isRunning(runnable) {
  return runnable.timeout !== undefined;
};

function complete(runnable) {
  return isDone(runnable) ? runnable.lastResult : complete(step(runnable));
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
}


runnable.ParseError = ParseError;
runnable.RuntimeError = RuntimeError;
runnable.DoneError = DoneError;

runnable.step = step;
runnable.complete = complete;

module.exports = runnable;
