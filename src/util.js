var _ = require("underscore");

var util = module.exports = {
  pp: function(str) {
    console.log(JSON.stringify(str, null, 2));
  },

  stripAst: function(obj) {
    if (typeof obj === "object") {
      delete obj.l;
      delete obj.s;
      Object.keys(obj).forEach(function(k) { util.stripAst(obj[k]) });
    }

    return obj
  },

  copyException: function(from, to) {
    to.stack = from.stack;
    to.message = from.message;
    for (var i in from) {
      to[i] = from[i];
    }

    return to;
  },

  defaultObj: function(keys, def) {
    return keys.reduce(function(o, p) {
      o[p] = (def instanceof Function ? def() : def);
      return o;
    }, {});
  },

  getNodeAt: function(node, keys) {
    var nextKey = keys[0];
    if (keys.length === 0) {
      return node;
    } else if (_.isArray(node) && nextKey in node) {
      return util.getNodeAt(node[nextKey], _.rest(keys));
    } else if (_.isObject(node) && node.t === nextKey) {
      return util.getNodeAt(node.c, _.rest(keys));
    } else {
      throw "Couldn't find node with key " + nextKey;
    }
  },

  mapCat: function(list, fn) {
    return list.reduce(function (acc, x) {
      return acc.concat(fn(x));
    }, []);
  }
};
