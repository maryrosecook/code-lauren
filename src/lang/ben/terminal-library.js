var _ = require("underscore");

var terminalLibrary = module.exports = {
  print: function(thingToPrint) {
    console.log(thingToPrint);
    return (thingToPrint !== undefined ? thingToPrint.toString() : "") + "\n";
  }
};
