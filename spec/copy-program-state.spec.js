var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var v = require("../src/lang/vm");

var env = require("../src/env.js");
var copyProgramState = require("../src/copy-program-state.js");

describe("copy-state", function() {
  describe("copyProgramState", function() {
    it("should be able to copy env at every step of empty program", function() {
      var code = "";

      var ps = v.initProgramState(code, c(p(code)));
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
  });
});
