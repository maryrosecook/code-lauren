var _ = require("underscore");

var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var v = require("../src/lang/vm");
var langUtil = require("../src/lang/lang-util");

var env = require("../src/env.js");

function functionsEqual(b) {
  var a = this;
  if (langUtil.isInternalStateBuiltin(a) || langUtil.isInternalStateBuiltin(b)) {
    expect(a.state).toEqual(b.state);
    return true;
  } else {
    return a === b;
  }
};

describe("copy-state", function() {
  describe("copyProgramState", function() {
    it("should be able to step through assignment and leave original env unchanged", function() {
      var code = "x: 5";
      var originalPs = v.initProgramState(code, c(p(code)));

      expect(originalPs.getIn(["callStack", 0, "env", "bindings", "x"])).toBeUndefined();

      ps = v.step(originalPs);
      expect(ps.get("currentInstruction")[0]).toEqual("push");
      expect(ps.getIn(["scopes",
                       ps.getIn(["callStack", 0, "scope"]),
                       "bindings",
                       "x"])).toBeUndefined();

      ps = v.step(ps);
      expect(ps.get("currentInstruction")[0]).toEqual("set_env");
      expect(ps.getIn(["scopes",
                       ps.getIn(["callStack", 0, "scope"]),
                       "bindings",
                       "x"])).toEqual(5);

      expect(originalPs.getIn(["scopes",
                               ps.getIn(["callStack", 0, "scope"]),
                               "bindings",
                               "x"])).toBeUndefined();
    });

    it("should not share counters between ps and its copy", function() {
      var code = 'counted(2)';

      var ps = v.initProgramState(code, c(p(code)));
      var ps2 = ps;

      expect(v.isComplete(ps)).toEqual(false);
      ps = v.step(ps);
      ps = v.step(ps);
      ps = v.step(ps);
      ps = v.step(ps);
      ps = v.step(ps);
      expect(v.isComplete(ps)).toEqual(true);
      expect(ps.get("stack").peek().v).toEqual(false);

      expect(v.isComplete(ps2)).toEqual(false);
      ps2 = v.step(ps2);
      ps2 = v.step(ps2);
      ps2 = v.step(ps2);
      ps2 = v.step(ps2);
      ps2 = v.step(ps2);
      expect(v.isComplete(ps2)).toEqual(true);
      expect(ps2.get("stack").peek().v).toEqual(false);
    });
  });
});
