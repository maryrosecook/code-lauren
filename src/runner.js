var lang = require("./lang/ben/interpreter");

function run(code, env) {
  try {
    var ast = lang.parse(code);
  } catch(e) {
    throw new ParseError(e);
  }

  return lang.interpret(ast, env);
};

function isDone(value) {
  return value instanceof Function;
};

// function step(vOrContinuation, done) {
//   if (isDone(vOrContinuation)) {
//     done(vOrContinuation);
//   } else {
//     vOrContinuation(function(v) {
//       step(v, done);
//     });
//   };
// };

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


run.ParseError = ParseError;
run.RuntimeError = RuntimeError;
run.DoneError = DoneError;
module.exports = run;
