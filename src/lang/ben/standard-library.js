var _ = require("underscore");

var createStandardLibrary = module.exports = function () {
  return {
    add: function() {
      return _.reduce(arguments, function(a, n) { return a + n; });
    },

    "new-dictionary": function() {
      return _.object(_.filter(arguments, function(_, i) { return i % 2 === 0; }),
                      _.filter(arguments, function(_, i) { return i % 2 === 1; }));
    },

    "less-than": function(a, b) {
      return a < b;
    },

    "greater-than": function(a, b) {
      return a > b;
    },

    set: function(dict, key, value) {
      dict[key] = value;
      return dict;
    },

    get: function(dict, key) {
      return dict[key];
    },

    print: function() {
      var output = _.map(arguments, function(x) { return x.toString(); }).join(" ");
      console.log(output);
      return output + "\n";
    }
  };
};
