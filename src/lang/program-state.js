var _ = require("underscore");
var im = require("immutable");

var standardLibrary = require("./standard-library");
var scope = require("./scope");

var BUILTIN_SCOPE_ID = 0;
var GLOBAL_SCOPE_ID = 1;

function currentCallFrame(p) {
  return p.get("callStack").last();
};

function isComplete(p) {
  var callStack = p.get("callStack");
  var callFrame = callStack.get(0);
  return callFrame === undefined ||
    (callStack.size === 1 &&
     callFrame.get("bcPointer") === callFrame.get("bc").length);
};

function isCrashed(p) {
  return p.get("exception") !== undefined;
};

function init(code, bc, builtinBindings) {
  builtinBindings = builtinBindings || standardLibrary();

  var bcPointer = 0;

  var p = im.Map({
    exception: undefined,
    code: code,
    currentInstruction: undefined,
    stack: im.Stack(),
    callStack: im.List(), // can't be a stack because too much editing of head
    scopes: im.List()
  });

  p = scope.addScope(p, builtinBindings); // builtin scope
  p = scope.addScope(p, im.Map(), BUILTIN_SCOPE_ID); // global scope - mouse, keyboard etc
  p = pushCallFrame(p, bc, bcPointer, GLOBAL_SCOPE_ID); // user top level scope
  return p;
};

function mergeTopLevelBindings(p, bindings) {
  for (var name in bindings) {
    p = p.set("scopes", scope.setBindingAtId(p.get("scopes"),
                                                GLOBAL_SCOPE_ID,
                                                name,
                                                bindings[name]));
  }

  return p;
};

function pushCallFrame(p, bc, bcPointer, scopeId, tail) {
  return p.set("callStack",
               p.get("callStack").push(im.Map({
                 bc: bc, bcPointer: bcPointer, scope: scopeId, tail: tail
               })));
};

module.exports = {
  init: init,
  currentCallFrame: currentCallFrame,
  isComplete: isComplete,
  isCrashed: isCrashed,
  mergeTopLevelBindings: mergeTopLevelBindings,
  pushCallFrame: pushCallFrame
};
