var _ = require("underscore");
var im = require("immutable");

var scope = require("./scope");
var heapLib = require("./heap");
var langUtil = require("./lang-util");

var BUILTIN_SCOPE_ID = 0;
var USER_TOP_LEVEL_SCOPE_ID = 1;

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
  var bcPointer = 0;

  var p = im.Map({
    exception: undefined,
    code: code,
    currentInstruction: undefined,
    stack: im.Stack(),
    callStack: im.List(), // can't be a stack because too much editing of head
    scopes: im.List(),
    heap: heapLib.create()
  });

  p = scope.addScope(p, im.Map(), undefined, false); // builtin scope, mouse, keyboard et
  p = createTopLevelBindings(p, builtinBindings);

  p = scope.addScope(p, im.Map(), BUILTIN_SCOPE_ID, true); // user top level scope
  p = pushCallFrame(p, bc, bcPointer, USER_TOP_LEVEL_SCOPE_ID);
  return p;
};

function createTopLevelBindings(p, bindings) {
  return bindings.keySeq().reduce(function(p, name) {
    var actualValue = bindings.get(name);
    var valueToStore;
    if (langUtil.isThing(actualValue)) {
      var heapAndPointer = heapLib.add(p.get("heap"), actualValue);
      p = p.set("heap", heapAndPointer.heap);
      valueToStore = heapAndPointer.pointer;
    } else {
      valueToStore = actualValue;
    }

    return p.set("scopes", scope.setBindingInScope(p.get("scopes"),
                                                   BUILTIN_SCOPE_ID,
                                                   name,
                                                   valueToStore,
                                                   scope.OVERRIDE_IMMUTABILITY));
  }, p);
};

function pushCallFrame(p, bc, bcPointer, scopeId, tail) {
  return p.set("callStack",
               p.get("callStack").push(im.Map({
                 bc: bc, bcPointer: bcPointer, scope: scopeId, tail: tail
               })));
};

function currentScopeId(p) {
  return currentCallFrame(p).get("scope");
};

function getFromHeap(p, pointer) {
  return heapLib.get(p.get("heap"), pointer);
};

function peekStack(p) {
  return p.getIn(["stack", -1]).v;
};

module.exports = {
  init: init,
  currentCallFrame: currentCallFrame,
  currentScopeId: currentScopeId,
  isComplete: isComplete,
  isCrashed: isCrashed,
  createTopLevelBindings: createTopLevelBindings,
  pushCallFrame: pushCallFrame,
  getFromHeap: getFromHeap,
  peekStack: peekStack
};
