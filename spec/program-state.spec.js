var im = require("immutable");
var sinon = require("sinon");

var parse = require("../src/lang/parser");
var compile = require("../src/lang/compiler");
var run = require("../src/lang/vm").complete;
var programState = require("../src/lang/program-state");
var standardLibrary = require("../src/lang/standard-library");

var inputterSetup = require("../src/inputter");

function createMockWindow() {
  return {
    addEventListener: sinon.stub()
  }
};

function createMockScreen() {
  return {};
};

describe("createTopLevelBindings", function() {
  it("should be able to merge inputter data (mouse etc)", function() {
    var code = 'get(mouse "button-is-down")';
    var inputter = inputterSetup(createMockWindow(), createMockScreen());

    var ps = programState.init(code, compile(parse(code)), standardLibrary());
    ps = programState.createTopLevelBindings(ps, inputter.getMouseBindings());
    ps = run(ps);

    expect(programState.peekStack(ps)).toEqual(false);
  });
});
