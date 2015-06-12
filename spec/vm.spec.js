var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var v = require("../src/lang/vm");
var standardLibrary = require("../src/lang/standard-library");
var createScope = require("../src/lang/scope");

var util = require("../src/util");

describe("bytecode interpreter", function() {
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

  describe("lambda invocation", function() {
    it("should return undefined from invoked empty lambda", function() {
      expect(v(c(p("{}()"))).stack.pop()).toBeUndefined();
    });

    it("should be able to pass args to lambda", function() {
      expect(v(c(p("{ ?a ?b \n a }(1 2)"))).stack.pop()).toEqual(1);
      expect(v(c(p("{ ?a ?b \n b }(1 2)"))).stack.pop()).toEqual(2);
    });

    it("should be able to access closed over var", function() {
      expect(v(c(p("a: 1 \n { a }()"))).stack.pop()).toEqual(1);
    });

    it("should use new value for closed over var that changes after closure creation", function() {
      expect(v(c(p("a: 1 \n b:{ a } \n a: 2 \n b()"))).stack.pop()).toEqual(2);
    });
  });

  describe("builtin function invocation", function() {
    it("should run built in function with args", function() {
      expect(v(c(p('print(1)'))).stack.pop()).toEqual("1\n");
    });
  });

  describe("label lookup", function() {
    it("should get label assigned in current scope", function() {
      var stack = v(c(p("a: 1 \n a"))).stack;
      expect(stack.pop()).toEqual(1);
    });

    it("should reassign label reassigned in current scope", function() {
      var stack = v(c(p("a: 1 \n a: 2\n a"))).stack;
      expect(stack.pop()).toEqual(2);
    });

    it("should get label assigned inside lambda", function() {
      expect(v(c(p("{ a: 1 \n a }()"))).stack.pop()).toEqual(1);
    });

    it("should get label assigned in higher scope", function() {
      expect(v(c(p("a: 1 \n { a }()"))).stack.pop()).toEqual(1);
    });

    it("should change value in inner scope", function() {
      expect(v(c(p("a: 1 \n { a: 2 \n a }()"))).stack.pop()).toEqual(2);
    });

    it("should change value in outer scope if changed in inner scope", function() {
      expect(v(c(p("a: 1 \n { a: 2 }() \n a"))).stack.pop()).toEqual(2);
    });

    it("should allow independent outer scope val if created after inner scope val", function() {
      expect(v(c(p("{ a: 2 }() \n a: 1 \n a"))).stack.pop()).toEqual(1);
    });
  });

  describe("assignment", function() {
    it("should assign literal to env at top level", function() {
      var env = v(c(p("a: 1"))).env;
      expect(env.getLocalBinding("a")).toEqual(1);
    });

    it("should assign literal to env at top level", function() {
      var fn = v(c(p("a: { 1 }"))).env.getLocalBinding("a");
      expect(fn.bc).toEqual([["push", 1],
                             ["return"]]);
      expect(fn.ast).toBeDefined();
    });
  });
});
