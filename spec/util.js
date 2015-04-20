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

  complete: function(g) {
    var result = g.next();
    if (result.done === true) {
      return result.value;
    } else {
      return util.complete(g);
    }
  },

  step: function(g) {
    return g.next().value;
  }
};
