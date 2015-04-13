var lang = require("./lang/ben/interpreter");

function runnable(code, env) {
  try {
    var ast = lang.parse(code);
  } catch(e) {
    throw new ParseError(e);
  }

  return {
    lastResult: function() {
      return lang.interpret(ast, env);
    }
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
  return !(runnable.lastResult instanceof Function);
};

function isRunning(runnable) {
  return runnable.timeout !== undefined;
};

function complete(runnable) {
  runnable = step(runnable);
  return isDone(runnable) ? runnable.lastResult : complete(runnable);
};

function ParseError(e) {
  copy(e, this);
};

function RuntimeError(e) {
  copy(e, this);
};

function DoneError(e) {
  copy(e, this);
};

function copy(from, to) {
  for (var i in from) {
    to[i] = from[i];
  }
}


runnable.ParseError = ParseError;
runnable.RuntimeError = RuntimeError;
runnable.DoneError = DoneError;

runnable.step = step;
runnable.complete = complete;

module.exports = runnable;
