var _ = require("underscore");

var util = module.exports = {
  pp: function(str) {
    console.log(JSON.stringify(str, null, 2));
  },

  stripAst: function(obj) {
    if (typeof obj === "object") {
      delete obj.l;
      delete obj.s;
      delete obj.tail;
      Object.keys(obj).forEach(function(k) { util.stripAst(obj[k]) });
    }

    return obj
  },

  stripBc: function(bc) {
    bc.forEach(function(instruction) {
      delete instruction.ast;
      if (instruction[0] === "push_lambda") {
        delete instruction[1].ast;
        util.stripBc(instruction[1].bc);
      }
    });

    return bc;
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
