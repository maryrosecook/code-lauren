var _ = require("underscore");

var util = require("../util");
var standardLibrary = require("./standard-library");
var scope = require("./scope");

function stepPush(ins, p) {
  p.stack.push(ins[1]);
  return p;
};

function stepPushLambda(ins, p) {
  var lambda = ins[1];
  lambda.closureEnv = _.last(p.envStack);
  p.stack.push(lambda);
  return p;
};

function stepPop(ins, p) {
  p.stack.pop();
  return p;
};

function stepGetEnv(ins, p) {
  p.stack.push(_.last(p.envStack).getScopedBinding(ins[1]));
  return p;
};

function stepSetEnv(ins, p) {
  _.last(p.envStack).setGlobalBinding(ins[1], p.stack.pop());
  return p;
};

function stepPopEnvScope(ins, p) {
  p.envStack.pop();
  return p;
};

function stepInvoke(ins, p) {
  var fn = p.stack.pop();
  var arity = ins[1];

  // TODO: raise errors for arity problems
  var args = _.range(arity).map(function() { return p.stack.pop(); }).reverse();

  if (fn.bc !== undefined) { // a lambda
    var lambdaEnv = scope(_.object(_.pluck(fn.ast.c[0], "c"), args), fn.closureEnv);
    Array.prototype.splice.apply(p.bc,
                                 [p.bcPointer, 0].concat(fn.bc));
    p.envStack.push(lambdaEnv);
  } else { // is a JS function object
    p.stack.push(fn.apply(null, args));
  }

  return p;
};

function stepIfNotTrueJump(ins, p) {
  if (p.stack.pop() !== true) {
    p.bcPointer += ins[1];
  }

  return p;
};

function stepJump(ins, p) {
  p.bcPointer += ins[1];
  return p;
};

function step(p) {
  var ins = p.bc[p.bcPointer];
  p.bcPointer++;

  if (ins === undefined) {
    return p;
  } else if (ins[0] === "push") {
    return stepPush(ins, p);
  } else if (ins[0] === "push_lambda") {
    return stepPushLambda(ins, p);
  } else if (ins[0] === "pop") {
    return stepPop(ins, p);
  } else if (ins[0] === "get_env") {
    return stepGetEnv(ins, p);
  } else if (ins[0] === "set_env") {
    return stepSetEnv(ins, p);
  } else if (ins[0] === "pop_env_scope") {
    return stepPopEnvScope(ins, p);
  } else if (ins[0] === "invoke") {
    return stepInvoke(ins, p);
  } else if (ins[0] === "if_not_true_jump") {
    return stepIfNotTrueJump(ins, p);
  } else if (ins[0] === "jump") {
    return stepJump(ins, p);
  } else if (ins[0] === "return") {
    return p;
  } else {
    throw new Error("I don't know how to run this instruction: " + ins);
  }
};

function complete(p) {
  while (!isComplete(p)) {
    p = step(p);
  }

  return p;
};

function isComplete(p) {
  return p.bcPointer === p.bc.length;
};

function createProgram(bc, env, stack) {
  return {
    bc: bc,
    bcPointer: 0,
    envStack: [env ? env : scope(standardLibrary())],
    stack: stack || []
  };
};

function createProgramAndComplete(bc, env, stack) {
  return complete(createProgram(bc, env, stack));
};

function RuntimeError(e) {
  util.copyException(e, this);
};
RuntimeError.prototype = new Error();

createProgramAndComplete.createProgramAndComplete = createProgramAndComplete;
createProgramAndComplete.createProgram = createProgram;
createProgramAndComplete.step = step;
createProgramAndComplete.complete = complete;
createProgramAndComplete.isComplete = isComplete;

createProgramAndComplete.RuntimeError = RuntimeError;

module.exports = createProgramAndComplete;
