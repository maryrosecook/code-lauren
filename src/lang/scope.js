function Scope(bindings, parent) {
  this.bindings = bindings;
  this.parent = parent;
};

Scope.prototype = {
  getLocalBinding: function(k) {
    return this.bindings[k];
  },

  getScopedBinding: function(k) {
    if (k in this.bindings) {
      return this.getLocalBinding(k);
    } else if (this.parent !== undefined) {
      return this.parent.getScopedBinding(k);
    }
  },

  setLocalBinding: function(k, v) {
    this.bindings[k] = v;
  },

  setGlobalBinding: function(k, v) {
    var scope = this;
    while(scope !== undefined) {
      if (scope.bindings[k] !== undefined) {
        scope.setLocalBinding(k, v);
        return;
      } else {
        scope = scope.parent;
      }
    }

    this.setLocalBinding(k, v);
  }
};

function createScope(bindings, parent) {
  return new Scope(bindings, parent);
};

module.exports = createScope;
