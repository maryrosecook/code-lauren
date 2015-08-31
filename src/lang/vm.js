var _ = require("underscore");

var util = require("../util");
var standardLibrary = require("./standard-library");
var envModule = require("../env");
var scope = require("./scope");
var langUtil = require("./lang-util");
var checkArgs = require("./check-args");

var copyProgramState;
function stepPush(ins, p) {
  copyProgramState = copyProgramState || require("../copy-program-state");
  p.stack.push({ v: copyProgramState.copyValue(ins[1]), ast: ins.ast });
  return p;
};

function stepPushLambda(ins, p) {
  var lambda = ins[1];
  lambda.closureEnv = currentCallFrame(p).env;
  p.stack.push({ v: lambda, ast: ins.ast });
  return p;
};

function stepPop(ins, p) {
  throwIfUninvokedStackFunctions(p);
  p.stack.pop();
  return p;
};

function stepReturn(ins, p) {
  throwIfUninvokedStackFunctions(p);
  p.callStack.pop();
  return p;
};

var ARG_START = ["ARG_START"];
function stepArgStart(ins, p) {
  p.stack.push({ v: ARG_START });
  return p;
};

function stepGetEnv(ins, p) {
  var value = currentCallFrame(p).env.getScopedBinding(ins[1]);
  if (value === undefined) {
    throw new langUtil.RuntimeError("Never heard of " + ins[1], ins.ast);
  } else {
    p.stack.push({ v: value, ast: ins.ast });
    return p;
  }
};

function stepSetEnv(ins, p) {
  currentCallFrame(p).env.setGlobalBinding(ins[1], p.stack.pop().v);
  return p;
};

function stepInvoke(ins, p, noSideEffects) {
  var fnStackItem = p.stack.pop();
  var fn = fnStackItem.v;

  if (langUtil.isFunction(fn)) {
    var argContainers = getTopArgsOnStack(p.stack).reverse();
    var argValues = _.pluck(argContainers, "v");

    if (langUtil.isLambda(fn)) {
      checkArgs.checkLambdaArity(fnStackItem, argContainers, ins.ast);

      var lambdaEnv = scope(_.object(fn.parameters, argValues), fn.closureEnv);
      var tailIndex = tailCallIndex(p.callStack, fn);
      if (tailIndex !== undefined) { // if tail position exprs all way to recursive call then tco
        p.callStack = p.callStack.slice(0, tailIndex + 1);
        currentCallFrame(p).env = lambdaEnv;
        currentCallFrame(p).bcPointer = 0;
      } else {
        p.callStack.push(createCallFrame(fn.bc, 0, lambdaEnv, ins[2]));
      }

      return p;
    } else if (langUtil.isJsFn(fn)) {
      if (noSideEffects !== langUtil.NO_SIDE_EFFECTS || fn.hasSideEffects !== true) {
        checkArgs.checkBuiltinNoExtraArgs(fnStackItem, argContainers, fn.length);

        var meta = new langUtil.Meta(ins.ast);
        // make fn its own context so it can access its internal state var if required
        p.stack.push({ v: fn.apply(fn, [meta].concat(argValues)), ast: ins.ast });
      }

      return p;
    }
  } else {
    throw new langUtil.RuntimeError("This is not an action", fnStackItem.ast);
  }
};

function tailCallIndex(callStack, fn) {
  var recursiveIndex = previousRecursionCallFrameIndex(callStack, fn);
  if (recursiveIndex !== undefined) {
    var calls = callStack.slice(recursiveIndex);
    if (calls.length === calls.filter(function(c) { return c.tail === true; }).length) {
      return recursiveIndex;
    }
  }
};

function previousRecursionCallFrameIndex(callStack, fn) {
  for (var i = callStack.length - 1; i >= 0; i--) {
    if (callStack[i].bc === fn.bc) {
      return i;
    }
  }
};

function stepIfNotTrueJump(ins, p) {
  if (p.stack.pop().v !== true) {
    currentCallFrame(p).bcPointer += ins[1];
  }

  return p;
};

function stepJump(ins, p) {
  currentCallFrame(p).bcPointer += ins[1];
  return p;
};

function step(p, noSideEffects) {
  var callFrame = currentCallFrame(p);
  if (callFrame === undefined) {
    return p;
  } else {
    var ins = callFrame.bc[callFrame.bcPointer];
    callFrame.bcPointer++;

    p.currentInstruction = ins;

    try {
      if (ins[0] === "push") {
        return stepPush(ins, p);
      } else if (ins[0] === "push_lambda") {
        return stepPushLambda(ins, p);
      } else if (ins[0] === "pop") {
        return stepPop(ins, p);
      } else if (ins[0] === "get_env") {
        return stepGetEnv(ins, p);
      } else if (ins[0] === "set_env") {
        return stepSetEnv(ins, p);
      } else if (ins[0] === "invoke") {
        return stepInvoke(ins, p, noSideEffects);
      } else if (ins[0] === "if_not_true_jump") {
        return stepIfNotTrueJump(ins, p);
      } else if (ins[0] === "jump") {
        return stepJump(ins, p);
      } else if (ins[0] === "return") {
        return stepReturn(ins, p);
      } else if (ins[0] === "arg_start") {
        return stepArgStart(ins, p);
      } else {
        throw new langUtil.RuntimeError("I don't know how to run this instruction: " + ins,
                                        ins.ast);
      }
    } catch (e) {
      p.crashed = true;
      if (e instanceof langUtil.RuntimeError) {
        throw e;
      } else {
        maybePrintError(e);
      }
    }
  }
};

function maybePrintError(e) {
  if (typeof(window) === "undefined" || window.location.href.indexOf("localhost:") !== -1) {
    console.log(e.stack);
  }
};

function complete(p) {
  while (!isComplete(p)) {
    p = step(p);
  }

  return p;
};

function currentCallFrame(p) {
  return _.last(p.callStack);
};

function isComplete(p) {
  var callFrame = currentCallFrame(p);
  return callFrame === undefined ||
    callFrame.bcPointer === callFrame.bc.length;
};

function isCrashed(p) {
  return p.crashed === true;
};

function initProgramState(code, bc, env, stack) {
  return {
    crashed: false,
    code: code,
    callStack: [createCallFrame(bc, 0, env ? env : envModule.createEnv(standardLibrary()))],
    stack: stack || [],
    currentInstruction: undefined
  };
};

function createCallFrame(bc, bcPointer, env, tail) {
  return { bc: bc, bcPointer: bcPointer, env: env, tail: tail };
};

function initProgramStateAndComplete(code, bc, env, stack) {
  return complete(initProgramState(code, bc, env, stack));
};

function throwIfUninvokedStackFunctions(p) {
  var unrunFn = _.chain(p.stack).find(o => langUtil.isFunction(o.v)).value();
  if (unrunFn !== undefined) {
    throw new langUtil.RuntimeError("This is an action. Type " +
                                    p.code.slice(unrunFn.ast.s, unrunFn.ast.e) +
                                    "() to run it.",
                                    unrunFn.ast);
  }
};

function getTopArgsOnStack(stack) {
  var args = [];
  while (stack.length > 0 && _.last(stack).v !== ARG_START) {
    args.push(stack.pop());
  }

  stack.pop(); // throw away arg_start instruction
  return args;
};

initProgramStateAndComplete.initProgramStateAndComplete = initProgramStateAndComplete;
initProgramStateAndComplete.initProgramState = initProgramState;
initProgramStateAndComplete.step = step;
initProgramStateAndComplete.complete = complete;
initProgramStateAndComplete.isComplete = isComplete;
initProgramStateAndComplete.isCrashed = isCrashed;
initProgramStateAndComplete.createCallFrame = createCallFrame;

module.exports = initProgramStateAndComplete;
