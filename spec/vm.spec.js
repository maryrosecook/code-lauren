var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var v = require("../src/lang/vm");

var standardLibrary = require("../src/lang/standard-library");
var createScope = require("../src/lang/scope");

var util = require("../src/util");

describe("vm", function() {
  describe("top level", function() {
    it("should return undefined from an empty program", function() {
      var code = "";
      expect(v(code, c(p(code))).stack.pop().v).toBeUndefined();
    });

    it("should return 1 from a program containing just 1", function() {
      var code = "1";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(1);
    });

    it("should return 2 from a program containing 1 and 2", function() {
      var code = "1\n2";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(2);
    });
  });

  describe("lambda invocation", function() {
    it("should return undefined from invoked empty lambda", function() {
      var code = "{}()";
      expect(v(code, c(p(code))).stack.pop().v).toBeUndefined();
    });

    it("should be able to pass args to lambda", function() {
      var code = "{ ?a ?b \n a }(1 2)";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(1);

      var code = "{ ?a ?b \n b }(1 2)";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(2);
    });

    it("should be able to access closed over var", function() {
      var code = "a: 1 \n { a }()";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(1);
    });

    it("should use new value for closed over var that changes after closure creation", function() {
      var code = "a: 1 \n b:{ a } \n a: 2 \n b()";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(2);
    });
  });

  describe("uninvoked functions in a do", function() {
    it("should complain about returned uninvoked lambda/builtin", function() {
      var code = "a: {}\n a";
      expect(function() { v(code, c(p(code))); })
        .toThrow("This is an action. Type a() to run it.");

      var code = "print";
      expect(function() { v(code, c(p(code))); })
        .toThrow("This is an action. Type print() to run it.");
    });

    it("should complain about uninvoked lambda/builtin part way through do", function() {
      var code = "a: {}\n a \n 1";
      expect(function() { v(code, c(p(code))); })
        .toThrow("This is an action. Type a() to run it.");

      var code = "print \n 1";
      expect(function() { v(code, c(p(code))); })
        .toThrow("This is an action. Type print() to run it.");
    });
  });

  describe("builtin function invocation", function() {
    it("should run built in function with args", function() {
      var code = "print(1)";
      expect(v(code, c(p(code))).stack.pop().v).toEqual("1\n");
    });
  });

  describe("label lookup", function() {
    it("should get label assigned in current scope", function() {
      var code = "a: 1 \n a";
      var stack = v(code, c(p(code))).stack;
      expect(stack.pop().v).toEqual(1);
    });

    it("should reassign label reassigned in current scope", function() {
      var code = "a: 1 \n a: 2\n a";
      var stack = v(code, c(p(code))).stack;
      expect(stack.pop().v).toEqual(2);
    });

    it("should get label assigned inside lambda", function() {
      var code = "{ a: 1 \n a }()";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(1);
    });

    it("should get label assigned in higher scope", function() {
      var code = "a: 1 \n { a }()";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(1);
    });

    it("should change value in inner scope", function() {
      var code = "a: 1 \n { a: 2 \n a }()";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(2);
    });

    it("should change value in outer scope if changed in inner scope", function() {
      var code = "a: 1 \n { a: 2 }() \n a";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(2);
    });

    it("should allow independent outer scope val if created after inner scope val", function() {
      var code = "{ a: 2 }() \n a: 1 \n a";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(1);
    });
  });

  describe("assignment", function() {
    it("should assign literal to env at top level", function() {
      var code = "a: 1 \n a";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(1);
    });

    it("should assign lambda to env at top level", function() {
      var code = "a: { 1 }";
      var ps = v.initProgramState(code, c(p(code)));
      v.step(ps);
      v.step(ps);

      var binding = ps.callStack[0].env.bindings.a;
      expect(util.stripBc(binding.bc)).toEqual([["push", 1],
                                                ["return"]]);
      expect(binding.parameters).toBeDefined();
    });
  });

  describe("forever", function() {
    it("should run for a long time", function() {
      var code = "n: 1 \n forever { n: add(n 1) \n if equal(n 100) { blowup() } }";
      expect(function() {
        v(code, c(p(code)));
      }).toThrow("Never heard of blowup");
    });
  });

  describe("conditionals", function() {
    it("should return first branch if true", function() {
      var code = "if true { 1 }";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(1);
    });

    it("should return else if if is true", function() {
      var code = "if false { 1 } else { 2 }";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(2);
    });

    it("should return undefined if false and no second branch", function() {
      var code = "if false { 1 }";
      expect(v(code, c(p(code))).stack.pop()).toBeUndefined();
    });

    it("should allow s-expression in branch", function() {
      var code = 'if true { print("hi") }';
      expect(v(code, c(p(code))).stack.pop().v).toEqual("hi\n");
    });

    it("should return else if branch if condition true and if condition false", function() {
      var code = "if false { 1 } elseif true { 2 }";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(2);
    });

    it("should return if branch if condition true and else if condition true", function() {
      var code = "if true { 1 } elseif true { 2 }";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(1);
    });

    it("should return else branch if if and if else conditions false", function() {
      var code = "if false { 1 } elseif false { 2 } else { 3 }";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(3);
    });

    it("should return second else branch if true and prev conditions false", function() {
      var code = "if false { 1 } elseif false { 2 } elseif true { 3 }";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(3);
    });

    it("should not return else if previous condition is true", function() {
      var code = "if false { 1 } elseif true { 2 } else { 3 }";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(2);
    });

    it("should be able to run nested conditionals", function() {
      var code = "if true { if true { 1 } else { 2 } }";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(1);

      var code = "if true { if false { 1 } else { 2 } }";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(2);

      var code = "if false { if false { 1 } else { 2 } } else { 3 }";
      expect(v(code, c(p(code))).stack.pop().v).toEqual(3);
    });
  });

  describe("recursion", function() {
    it("should trampoline a program where there is an if in the tail position", function() {
      var code = 'tozero: { ?x if equal(x 0) { "done" } else { tozero(subtract(x 1)) } } \n tozero(20000)';
      expect(v(code, c(p(code))).stack.pop().v).toEqual("done");
    });
  });
});
