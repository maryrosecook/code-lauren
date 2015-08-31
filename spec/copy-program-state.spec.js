var _ = require("underscore");

var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var v = require("../src/lang/vm");
var langUtil = require("../src/lang/lang-util");

var env = require("../src/env.js");
var copyProgramState = require("../src/copy-program-state.js");

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
    it("should only be one internal state fn - want to manually patch new ones", function() {
      var code = "";
      var ps = v.initProgramState(code, c(p(code)));
      var bindings = ps.callStack[0].env.parent.bindings;
      expect(Object.keys(bindings)
             .map(function(k) { return bindings[k]; })
             .filter(langUtil.isInternalStateBuiltin).length)
        .toEqual(1);
    });

    it("should be able to copy env at every step of empty program", function() {
      var code = "";
      var ps = v.initProgramState(code, c(p(code)));

      // stick custom function matcher on internal state functions
      ps.callStack[0].env.parent.bindings.counted.jasmineMatches = functionsEqual;

      expect(ps).toEqual(copyProgramState(ps));
      expect(ps === copyProgramState(ps)).toEqual(false);

      while (!v.isComplete(ps)) {
        v.step(ps);
        expect(ps).toEqual(copyProgramState(ps));
        expect(ps === copyProgramState(ps)).toEqual(false);
      }
    });

    it("should be able to copy env at every step of assignment", function() {
      var code = "a: 1";

      var ps = v.initProgramState(code, c(p(code)));

      // stick custom function matcher on internal state functions
      ps.callStack[0].env.parent.bindings.counted.jasmineMatches = functionsEqual;

      expect(ps).toEqual(copyProgramState(ps));
      expect(ps === copyProgramState(ps)).toEqual(false);

      while (!v.isComplete(ps)) {
        v.step(ps);
        expect(ps).toEqual(copyProgramState(ps));
        expect(ps === copyProgramState(ps)).toEqual(false);
      }
    });

    it("should be able to copy env at every step of lambda creation", function() {
      var code = "{}()"; // invoke to stop compiler complaining about uninvoked lambda

      var ps = v.initProgramState(code, c(p(code)));

      // stick custom function matcher on internal state functions
      ps.callStack[0].env.parent.bindings.counted.jasmineMatches = functionsEqual;

      expect(ps).toEqual(copyProgramState(ps));
      expect(ps === copyProgramState(ps)).toEqual(false);

      while (!v.isComplete(ps)) {
        v.step(ps);
        expect(ps).toEqual(copyProgramState(ps));
        expect(ps === copyProgramState(ps)).toEqual(false);
      }
    });

    it("should be able to copy env at every step of lambda assignment", function() {
      var code = "a: {}";

      var ps = v.initProgramState(code, c(p(code)));

      // stick custom function matcher on internal state functions
      ps.callStack[0].env.parent.bindings.counted.jasmineMatches = functionsEqual;

      expect(ps).toEqual(copyProgramState(ps));
      expect(ps === copyProgramState(ps)).toEqual(false);

      var i = 0;
      while (!v.isComplete(ps)) {
        v.step(ps);

        expect(ps).toEqual(copyProgramState(ps));
        expect(ps === copyProgramState(ps)).toEqual(false);
        i += 1;
      }
    });

    it("should be able to copy env for recursive calls", function() {
      var code = 'tozero: { ?x if equal(x 0) { "done" } else { tozero(subtract(x 1)) } } \n tozero(5)';

      var ps = v.initProgramState(code, c(p(code)));

      // stick custom function matcher on internal state functions
      ps.callStack[0].env.parent.bindings.counted.jasmineMatches = functionsEqual;

      expect(ps).toEqual(copyProgramState(ps));
      expect(ps === copyProgramState(ps)).toEqual(false);

      var i = 0;
      while (!v.isComplete(ps)) {
        v.step(ps);

        expect(ps).toEqual(copyProgramState(ps));
        expect(ps === copyProgramState(ps)).toEqual(false);
        i += 1;
      }
    });

    it("should not share counters between ps and its copy", function() {
      var code = 'counted(2)';

      var ps = v.initProgramState(code, c(p(code)));
      var ps2 = copyProgramState(ps);

      expect(v.isComplete(ps)).toEqual(false);
      v.step(ps);
      v.step(ps);
      v.step(ps);
      v.step(ps);
      v.step(ps);
      expect(v.isComplete(ps)).toEqual(true);
      expect(_.last(ps.stack).v).toEqual(false);

      expect(v.isComplete(ps2)).toEqual(false);
      v.step(ps2);

      v.step(ps2);

      v.step(ps2);

      v.step(ps2);

      v.step(ps2);

      expect(v.isComplete(ps2)).toEqual(true);
      expect(_.last(ps2.stack).v).toEqual(false);
    });
  });
});
