var _ = require("underscore");

var library = module.exports = {
  print: function(thingToPrint) {
    console.log(thingToPrint);
    return (thingToPrint !== undefined ? thingToPrint.toString() : "") + "\n";
  },

  add: function() {
    return _.reduce(arguments, function(a, n) { return a + n; });
  },

  "new-dictionary": function() {
    return _.object(_.filter(arguments, function(_, i) { return i % 2 === 0; }),
                    _.filter(arguments, function(_, i) { return i % 2 === 1; }));
  },

  set: function(dict, key, value) {
    dict[key] = value;
    return dict;
  },

  get: function(dict, key) {
    return dict[key];
  }
};
