var im = require("immutable");
var util = require("../util");

function getScopedBinding(scopes, scopeId, k) {
  var scope = scopes.get(scopeId);
  if (scope.hasIn(["bindings", k])) {
    return scope.getIn(["bindings", k]);
  } else if (scope.get("parent") !== undefined) {
    return getScopedBinding(scopes, scope.get("parent"), k);
  }
};

function setGlobalBinding(scopes, scopeId_, k, v) {
  var originalScopeId = scopeId_;

  return (function set(currentScopeId) {
    if (scopes.getIn([currentScopeId, "bindings", k]) !== undefined) {
      return scopes.setIn([currentScopeId, "bindings", k], v);
    } else if (scopes.getIn([currentScopeId, "parent"]) !== undefined) {
      return set(scopes.getIn([currentScopeId, "parent"]));
    } else {
      return scopes.setIn([originalScopeId, "bindings", k], v);
    }
  })(originalScopeId);
};

function addScope(p, bindings, parent) {
  return p.update("scopes", util.push(im.Map({ bindings: bindings, parent: parent })));
};

function lastScopeId(p) {
  return p.get("scopes").size - 1;
};

addScope.getScopedBinding = getScopedBinding;
addScope.setGlobalBinding = setGlobalBinding;
addScope.lastScopeId = lastScopeId;
module.exports = addScope;
