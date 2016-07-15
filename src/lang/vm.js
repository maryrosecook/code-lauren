var _ = require("underscore");
var im = require("immutable");

var util = require("../util");
var setupEnv = require("../env");
var scope = require("./scope");
var langUtil = require("./lang-util");
var checkArgs = require("./check-args");
var programState = require("./program-state");

function stepPush(ins, p) {
  // TODO: when have lists and objects in lang, will need to detect them and use immutablejs

  return p.set("stack", p.get("stack").unshift({ v: ins[1], ast: ins.ast }));
};

function stepPushLambda(ins, p) {
  var lambda = ins[1];

  // once created, will have this id for rest of program, so don't need
  // immutable data
  lambda = lambda.set("closureScope",
                      programState.currentCallFrame(p)
                        .get("scope")); // an id into the p.scopes object

  return p.set("stack", p.get("stack").unshift({ v: lambda, ast: ins.ast }));
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
  return p.set("stack", p.get("stack").push({ v: ARG_START }));
};

function stepGetEnv(ins, p) {
  var scopes = p.get("scopes");
  var currentScope = programState.currentCallFrame(p).get("scope");
  var key = ins[1];

  if (!scope.hasScopedBinding(scopes, currentScope, key)) {
    throw new langUtil.RuntimeError("Never heard of " + ins[1], ins.ast);
  } else {
    var value = scope.getScopedBinding(scopes, currentScope, key);
    return p.set("stack", p.get("stack").push({ v: value, ast: ins.ast }));
  }
};

function stepSetEnv(ins, p) {
  var currentScopeId = programState.currentCallFrame(p).get("scope");
  var variableName = ins[1];
  var variableValue = p.get("stack").peek().v;
  return p
    .set("stack", p.get("stack").shift())
    .set("scopes",
         scope.setGlobalBinding(p.get("scopes"), currentScopeId, variableName, variableValue));
};

function stepInvoke(ins, p, noOutputting) {
  var fnStackItem = p.get("stack").peek();
  p = p.set("stack", p.get("stack").shift());
  var fnObj = fnStackItem.v;

  if (langUtil.isInvokable(fnObj)) {
    var pAndArgContainers = popTopArgsOnStack(p);
    var p = pAndArgContainers[0];
    var argContainers = pAndArgContainers[1];
    var argValues = argContainers.map(function(c) { return c.v; });

    if (langUtil.isLambda(fnObj)) {
      checkArgs.checkLambdaArgs(fnStackItem, argContainers, ins.ast);
      p = scope.addScope(p,
                         im.Map(_.object(fnObj.get("parameters"), argValues)),
                         fnObj.get("closureScope"));

      var tailIndex = tailCallIndex(p.get("callStack"), fnObj);
      if (tailIndex !== undefined) { // if tail position exprs all way to recursive call then tco
        return p
          .set("callStack", p.get("callStack").slice(0, tailIndex + 1))
          .setIn(["callStack", -1, "scope"], scope.lastScopeId(p))
          .setIn(["callStack", -1, "bcPointer"], 0);
      } else {
        return programState.pushCallFrame(p, fnObj.get("bc"), 0, scope.lastScopeId(p), ins[2]);
      }
    } else if (langUtil.isBuiltin(fnObj)) {
      if (noOutputting !== langUtil.NO_OUTPUTTING ||
          !langUtil.isBuiltinOutputting(fnObj)) {

        var fn = fnObj.get("fn");
        if (langUtil.isBuiltinInternalState(fnObj)) {
          var meta = new langUtil.Meta(ins.ast, fnObj.get("state"));
          var result = fn.apply(null, [meta].concat(argValues));
          var fnName = fnStackItem.ast.c;

          return p.set("stack", p.get("stack").unshift({ v: result.v, ast: ins.ast }))
            .setIn(["scopes", 0, "bindings", fnName, "state"], result.state);
        } else if (langUtil.isBuiltinNormal(fnObj) ||
                   langUtil.isBuiltinOutputting(fnObj)) {
          var meta = new langUtil.Meta(ins.ast);
          var result = fn.apply(null, [meta].concat(argValues));
          return p.set("stack", p.get("stack").unshift({ v: result, ast: ins.ast }));
        } else if (langUtil.isBuiltinMutating(fnObj)) {
          var meta = new langUtil.Meta(ins.ast);
          var newThing = fn.apply(null, [meta].concat(argValues));
          var currentScopeId = programState.currentCallFrame(p).get("scope");
          var varName = ins.ast.c[1].c;
          return p.set("scopes", scope.setGlobalBinding(p.get("scopes"),
                                                           currentScopeId,
                                                           varName,
                                                           newThing))
            .set("stack", p.get("stack").unshift({ v: newThing, ast: ins.ast }));
        }
      } else {
        return p;
      }
    } else {
      throw new langUtil.RuntimeError("Got invokable of unknown type", fnStackItem.ast);
    }
  } else {
    throw new langUtil.RuntimeError("This is not an action", fnStackItem.ast);
  }
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

    p = p.setIn(["callStack", -1, "bcPointer"], bcPointer + 1)
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

function initProgramStateAndComplete(code, bc, env) {
  return complete(programState.init(code, bc, env));
};

function maybePrintError(e) {
  if (typeof(window) === "undefined" || window.location.href.indexOf("localhost:") !== -1) {
    console.log(e.stack);
  }
};

function popTopArgsOnStack(p) {
  var stack = p.get("stack");

  var args = [];
  var element = stack.peek();
  while (element !== undefined && element.v !== ARG_START) {
    stack = stack.shift();
    args.push(element);
    element = stack.peek();
  }

  stack = stack.shift();

  return [
    p.set("stack", stack),
    args.reverse()
  ];
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
