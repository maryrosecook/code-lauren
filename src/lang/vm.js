var _ = require("underscore");
var im = require("immutable");

var util = require("../util");
var setupEnv = require("../env");
var scope = require("./scope");
var langUtil = require("./lang-util");
var checkArgs = require("./check-args");
var standardLibrary = require("./standard-library");
var programState = require("./program-state");

function StackValue(value, ast) {
  this.v = value;
  this.ast = ast;
};

function stepPush(ins, p) {
  return p.set("stack", p.get("stack").unshift(new StackValue(ins[1], ins.ast)));
};

function stepPushLambda(ins, p) {
  var lambda = ins[1];

  // once created, will have this id for rest of program, so don't need
  // immutable data
  lambda = lambda.set("closureScope",
                      programState.currentCallFrame(p)
                        .get("scope")); // an id into the p.scopes object

  return p.set("stack", p.get("stack").unshift(new StackValue(lambda, ins.ast)));
};

function stepPop(ins, p) {
  throwIfUninvokedStackFunctions(p);
  return p.set("stack", p.get("stack").shift());
};

function stepReturn(ins, p) {
  throwIfUninvokedStackFunctions(p);

  var callStack = p.get("callStack");
  return p
    .deleteIn(["scopes", callStack.last().get("scope")])
    .set("callStack", callStack.pop());
};

var ARG_START = ["ARG_START"];
function stepArgStart(ins, p) {
  return p.set("stack", p.get("stack").push(new StackValue(ARG_START)));
};

function stepGetEnv(ins, p) {
  var scopes = p.get("scopes");
  var currentScope = programState.currentCallFrame(p).get("scope");
  var key = ins[1];

  if (!scope.hasScopedBinding(scopes, currentScope, key)) {
    throw new langUtil.RuntimeError("Never heard of " + ins[1], ins.ast);
  } else {
    var value = scope.getScopedBinding(scopes, currentScope, key);
    return p.set("stack", p.get("stack").push(new StackValue(value, ins.ast)));
  }
};

function stepSetEnv(ins, p) {
  var currentScopeId = programState.currentCallFrame(p).get("scope");
  var variableName = ins[1];
  var variableValue = p.get("stack").peek().v;

  try {
    var scopes = scope.setGlobalBinding(p.get("scopes"),
                                        currentScopeId,
                                        variableName,
                                        variableValue);
  } catch (e) {
    throw new langUtil.RuntimeError(e.message, ins.ast);
  }

  return p
    .set("stack", p.get("stack").shift())
    .set("scopes", scopes);
};

function stepInvoke(ins, p, noOutputting) {
  var fnStackItem = p.get("stack").peek();
  var fnObj = fnStackItem.v;

  if (!langUtil.isInvokable(fnObj)) {
    throw new langUtil.RuntimeError("This is not an action", fnStackItem.ast);
  }

  if (langUtil.isLambda(fnObj)) {
    return invokeLambda(ins, p);
  } else if (langUtil.isBuiltin(fnObj)) {
    return invokeBuiltin(ins, p, noOutputting);
  }
};

function invokeLambda(ins, p) {
  var fnStackItem = p.get("stack").peek();
  var fnObj = fnStackItem.v;
  var argContainers = popFnArgs(p).args;
  var argValues = _.pluck(argContainers, "v");

  checkArgs.checkLambdaArgs(fnStackItem, argContainers, ins.ast);
  p = scope.addScope(p,
                     mapParamsToArgs(fnObj.get("parameters"), argValues),
                     fnObj.get("closureScope"),
                     true);

  if (canTailCallOptimise(p.get("callStack"), fnObj)) { // tco not tested!
    return tailCallOptimise(p, p.get("callStack"), fnObj);
  } else {
    p = popFnArgs(p).p;
    return programState
      .pushCallFrame(p,
                     fnObj.get("bc"), 0, scope.lastScopeId(p), ins[2]);
  }
};

function invokeBuiltin(ins, p, noOutputting) {
  var fnObj = p.get("stack").peek().v;

  if (functionOutputsAndOutputtingIsOff(fnObj, noOutputting)) {
    return popFnArgs(p).p;
  } else {
    var argContainers = popFnArgs(p).args;
    var result = runFnObj(fnObj, p, argContainers);
    p = popFnArgs(result.p).p;
    return p.set("stack", p.get("stack").unshift(new StackValue(result.v, ins.ast)));
  }
};

function mapParamsToArgs(parameters, argValues) {
  return im.Map(_.object(parameters, argValues));
};

function runFnObj(fnObj, p, argContainers) {
  var argValues = _.pluck(argContainers, "v");
  return fnObj.get("fn").apply(null, [p].concat(argValues));
};

function tailCallOptimise(p, callStack, fnObj) {
  var tailIndex = tailCallIndex(callStack, fnObj);
  p = popFnArgs(p).p;
  return p
    .set("callStack", p.get("callStack").slice(0, tailIndex + 1))
    .setIn(["callStack", -1, "scope"], scope.lastScopeId(p))
    .setIn(["callStack", -1, "bcPointer"], 0);
};

function canTailCallOptimise(callStack, fnObj) {
  // if tail position exprs all way to recursive call then tco
  return tailCallIndex(callStack, fnObj) !== undefined;
};

function tailCallIndex(callStack, fn) {
  var recursiveIndex = previousRecursionCallFrameIndex(callStack, fn);
  if (recursiveIndex !== undefined) {
    var calls = callStack.slice(recursiveIndex);
    if (calls.size === calls.filter(function(c) { return c.get("tail") === true; }).size) {
      return recursiveIndex;
    }
  }
};

function previousRecursionCallFrameIndex(callStack, fn) {
  for (var i = callStack.size - 1; i >= 0; i--) {
    if (callStack.getIn([i, "bc"]) === fn.get("bc")) {
      return i;
    }
  }
};

function stepIfNotTrueJump(ins, p) {
  var boolToTest = p.get("stack").peek().v;
  p = p.set("stack", p.get("stack").shift());

  if (boolToTest !== true) {
    return p.updateIn(["callStack", -1, "bcPointer"],
                      function(bcPointer) { return bcPointer + ins[1] });
  } else {
    return p;
  }
};

function stepJump(ins, p) {
  return p.updateIn(["callStack", -1, "bcPointer"],
                    function(bcPointer) { return bcPointer + ins[1] });
};

function step(p, noOutputting) {
  var currentFrame = programState.currentCallFrame(p);
  if (currentFrame === undefined) {
    return p;
  } else {
    var bcPointer = currentFrame.get("bcPointer");
    var ins = currentFrame.get("bc")[bcPointer];

    p = p
      .setIn(["callStack", -1, "bcPointer"], bcPointer + 1)
      .set("currentInstruction", ins);

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
        return stepInvoke(ins, p, noOutputting);
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
      if (e instanceof langUtil.RuntimeError) {
        p = p.set("exception", e);
      } else {
        maybePrintError(e);
      }

      return p;
    }
  }
};

function complete(p) {
  while (!programState.isComplete(p) && !programState.isCrashed(p)) {
    p = step(p);
  }

  return p;
};

function initProgramStateAndComplete(code, bc) {
  return complete(programState.init(code, bc, standardLibrary()));
};

function maybePrintError(e) {
  if (areTesting || areOnLocalhost()) {
    console.log(e.stack);
  }
};

function areTesting() {
  return typeof window === "undefined";
};

function areOnLocalhost() {
  return window.location.href.indexOf("localhost:") !== -1;
};

function popFnArgs(p) {
  var stack = p.get("stack");

  stack = stack.shift(); // chuck function

  var args = [];
  var element = stack.peek();
  while (element !== undefined && element.v !== ARG_START) {
    stack = stack.shift();
    args.push(element);
    element = stack.peek();
  }

  stack = stack.shift(); // chuck ARG_START

  return {
    p: p.set("stack", stack),
    args: args.reverse()
  };
};

function functionOutputsAndOutputtingIsOff(fnObj, noOutputting) {
  return noOutputting === langUtil.NO_OUTPUTTING &&
    langUtil.isBuiltinOutputting(fnObj);
};

function throwIfUninvokedStackFunctions(p) {
  var unrunFn = p.get("stack").find(o => langUtil.isInvokable(o.v));
  if (unrunFn !== undefined) {
    throw new langUtil.RuntimeError("This is an action. Type " +
                                    p.get("code").slice(unrunFn.ast.s, unrunFn.ast.e) +
                                    "() to run it.",
                                    unrunFn.ast);
  }
};

module.exports = _.extend(initProgramStateAndComplete, {
  initProgramStateAndComplete: initProgramStateAndComplete,
  step: step,
  complete: complete
});
