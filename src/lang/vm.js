var _ = require("underscore");

var util = require("../util");
var standardLibrary = require("./standard-library");
var scope = require("./scope");

function runEndOfProgram(ins, p) {
  return p;
};

function runPush(ins, p) {
  p.stack.push(ins[1]);
  return run(p);
};

function runPushLambda(ins, p) {
  var lambda = ins[1];
  lambda.closureEnv = p.env;
  p.stack.push(lambda);
  return run(p);
};

function runPop(ins, p) {
  p.stack.pop();
  return run(p);
};

function runGetEnv(ins, p) {
  p.stack.push(p.env.getScopedBinding(ins[1]));
  return run(p);
};

function runSetEnv(ins, p) {
  p.env.setGlobalBinding(ins[1], p.stack.pop());
  return run(p);
};

function runInvoke(ins, p) {
  var fn = p.stack.pop();
  var arity = ins[1];

  // TODO: raise errors for arity problems
  var args = _.range(arity).map(function() { return p.stack.pop(); }).reverse();

  if (fn.bc !== undefined) { // is a lambda
    var lambdaEnv = scope(_.object(_.pluck(fn.ast.c[0], "c"), args), fn.closureEnv);
    var pInner = run(createProgram(fn.bc, lambdaEnv, p.stack));

    if (p.stack.length > 0) {
      p.stack.push(pInner.stack.pop());
    }
  } else { // is a JS function object
    p.stack.push(fn.apply(null, args));
  }

  return run(p);
};

function run(p) {
  var ins = p.bc.shift();
  if (ins === undefined) {
    return runEndOfProgram(ins, p);
  } else if (ins[0] === "push") {
    return runPush(ins, p);
  } else if (ins[0] === "push_lambda") {
    return runPushLambda(ins, p);
  } else if (ins[0] === "pop") {
    return runPop(ins, p);
  } else if (ins[0] === "get_env") {
    return runGetEnv(ins, p);
  } else if (ins[0] === "set_env") {
    return runSetEnv(ins, p);
  } else if (ins[0] === "invoke") {
    return runInvoke(ins, p);
  } else if (ins[0] === "return") {
    return run(p);
  } else {
    throw new Error("I don't know how to run this instruction: " + ins);
  }
};

function createProgramAndRun(bc, env, stack) {
  return run(createProgram(bc, env, stack));
};

function createProgram(bc, env, stack) {
  return {
    bc: bc,
    env: env || scope(standardLibrary()),
    stack: stack || []
  };
};

createProgramAndRun.createProgramAndRun = createProgramAndRun;
createProgramAndRun.run = run;
createProgramAndRun.createProgram = createProgram;
module.exports = createProgramAndRun;
