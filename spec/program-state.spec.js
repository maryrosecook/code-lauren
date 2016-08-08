var im = require("immutable");

var parse = require("../src/lang/parser");
var compile = require("../src/lang/compiler");
var programState = require("../src/lang/program-state");

var inputterSetup = require("../src/inputter");

function createMockWindow() {
  return {
    addEventListener: function() {}
  }
};

function createMockScreen() {
  return {};
};

describe("mergeTopLevelBindings", function() {
  it("should be able to merge inputter data (mouse etc)", function() {
    var code = "whatever";
    var ps = programState.init(code, compile(parse(code)), im.Map());

    var inputter = inputterSetup(createMockWindow(), createMockScreen());
    programState.mergeTopLevelBindings(ps, inputter.getMouseBindings());
  });
});
