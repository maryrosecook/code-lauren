var im = require("immutable");
var util = require("../util");

function getScopedBinding(scopes, scopeId, k) {
  while (scopeId !== undefined) {
    var scope = scopes.get(scopeId);
    var bindings = scope.get("bindings");
    if (bindings.has(k)) {
      return bindings.get(k);
    } else {
      scopeId = scope.get("parent");
    }
  }
};

function hasScopedBinding(scopes, scopeId, k) {
  while (scopeId !== undefined) {
    var scope = scopes.get(scopeId);
    var bindings = scope.get("bindings");
    if (bindings.has(k)) {
      return true;
    } else {
      scopeId = scope.get("parent");
    }
  }

  return false;
};

function setGlobalBinding(scopes, originalScopeId, k, v) {
  var scopeId = originalScopeId;
  while (scopeId !== undefined) {
    if (scopes.getIn([scopeId, "bindings", k]) !== undefined) {
      return scopes.setIn([scopeId, "bindings", k], v);
    } else if (scopes.getIn([scopeId, "parent"]) !== undefined) {
      scopeId = scopes.getIn([scopeId, "parent"]);
    } else {
      return scopes.setIn([originalScopeId, "bindings", k], v);
    }
  }
};

function setBindingAtId(scopes, scopeId, k, v) {
  return scopes.setIn([scopeId, "bindings", k], v);
};

function addScope(p, bindings, parent) {
  return p.set("scopes", p.get("scopes").push(im.Map({ bindings: bindings, parent: parent })));
};

function lastScopeId(p) {
  return p.get("scopes").size - 1;
};

addScope.getScopedBinding = getScopedBinding;
addScope.hasScopedBinding = hasScopedBinding;
addScope.setGlobalBinding = setGlobalBinding;
addScope.lastScopeId = lastScopeId;
addScope.setBindingAtId = setBindingAtId;
module.exports = addScope;
