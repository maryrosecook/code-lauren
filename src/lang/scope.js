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
      return setValueInScope(scopes, scopeId, k, v);
    } else if (scopes.getIn([scopeId, "parent"]) !== undefined) {
      scopeId = scopes.getIn([scopeId, "parent"]);
    } else {
      return setValueInScope(scopes, originalScopeId, k, v);
    }
  }
};

function setValueInScope(scopes, scopeId, k, v) {
  if (!isScopeMutable(scopes, scopeId)) {
    throw new Error("Can't set the name `" + k + "`." +
                    "It's already being used by the system for something else. " +
                    "You can use a different name.");
  }

  return scopes.setIn([scopeId, "bindings", k], v);
};

function isScopeMutable(scopes, scopeId) {
  return scopes.getIn([scopeId, "isMutable"]) === true;
};

function setBindingAtId(scopes, scopeId, k, v) {
  return scopes.setIn([scopeId, "bindings", k], v);
};

function addScope(p, bindings, parent, isMutable) {
  var scope = im.Map({ bindings: bindings, parent: parent, isMutable: isMutable })
  return p.set("scopes", p.get("scopes").push(scope));
};

function lastScopeId(p) {
  return p.get("scopes").size - 1;
};

module.exports = {
  getScopedBinding: getScopedBinding,
  hasScopedBinding: hasScopedBinding,
  setGlobalBinding: setGlobalBinding,
  lastScopeId: lastScopeId,
  setBindingAtId: setBindingAtId,
  addScope: addScope
};
