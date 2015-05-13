var util = module.exports = {
  pp: function(str) {
    console.log(JSON.stringify(str, null, 2));
  },

  stripAst: function(obj) {
    if (typeof obj === "object") {
      delete obj.l;
      delete obj.i;
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
  }
};
