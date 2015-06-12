var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var v = require("../src/lang/vm");
var standardLibrary = require("../src/lang/standard-library");
var createScope = require("../src/lang/scope");

var util = require("../src/util");

ddescribe("bytecode interpreter", function() {
  describe("top level", function() {
    it("should return undefined from an empty program", function() {
      expect(v(c(p(""))).stack.pop()).toBeUndefined();
    });

    it("should return 1 from a program containing just 1", function() {
      expect(v(c(p("1"))).stack.pop()).toEqual(1);
    });

    it("should return 2 from a program containing 1 and 2", function() {
      expect(v(c(p("1\n2"))).stack.pop()).toEqual(2);
    });
  });

  // describe("lambda invocation", function() {
  //   it("should return undefined from invoked empty lambda", function() {
  //     expect(v(c(p("{}()")))).toBeUndefined();
  //   });

  // });

  describe("assignment", function() {
    it("should assign literal to env at top level", function() {
      var env = v(c(p("a: 1"))).env;
      expect(env.getLocalBinding("a")).toEqual(1);
    });

    it("should assign literal to env at top level", function() {
      var fn = v(c(p("a: { 1 }"))).env.getLocalBinding("a");
      expect(fn.bc).toEqual([["push", 1], ["return"]]);
      expect(fn.ast).toBeDefined();
    });

  });


});
