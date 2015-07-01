var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var v = require("../src/lang/vm");

var standardLibrary = require("../src/lang/standard-library");
var createScope = require("../src/lang/scope");

var util = require("../src/util");

describe("bytecode interpreter", function() {
  describe("top level", function() {
    it("should return undefined from an empty program", function() {
      var code = "";
      expect(v(code, c(p(code))).stack.pop()).toBeUndefined();
    });

    it("should return 1 from a program containing just 1", function() {
      var code = "1";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);
    });

    it("should return 2 from a program containing 1 and 2", function() {
      var code = "1\n2";
      expect(v(code, c(p(code))).stack.pop()).toEqual(2);
    });
  });

  describe("lambda invocation", function() {
    it("should return undefined from invoked empty lambda", function() {
      var code = "{}()";
      expect(v(code, c(p(code))).stack.pop()).toBeUndefined();
    });

    it("should be able to pass args to lambda", function() {
      var code = "{ ?a ?b \n a }(1 2)";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);

      var code = "{ ?a ?b \n b }(1 2)";
      expect(v(code, c(p(code))).stack.pop()).toEqual(2);
    });

    it("should be able to access closed over var", function() {
      var code = "a: 1 \n { a }()";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);
    });

    it("should be able to invoke an invocation with many applications", function() {
      var code = "{ { { 1 } } }()()()";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);
    });

    it("should use new value for closed over var that changes after closure creation", function() {
      var code = "a: 1 \n b:{ a } \n a: 2 \n b()";
      expect(v(code, c(p(code))).stack.pop()).toEqual(2);
    });
  });

  describe("builtin function invocation", function() {
    it("should run built in function with args", function() {
      var code = "print(1)";
      expect(v(code, c(p(code))).stack.pop()).toEqual("1\n");
    });
  });

  describe("label lookup", function() {
    it("should get label assigned in current scope", function() {
      var code = "a: 1 \n a";
      var stack = v(code, c(p(code))).stack;
      expect(stack.pop()).toEqual(1);
    });

    it("should reassign label reassigned in current scope", function() {
      var code = "a: 1 \n a: 2\n a";
      var stack = v(code, c(p(code))).stack;
      expect(stack.pop()).toEqual(2);
    });

    it("should get label assigned inside lambda", function() {
      var code = "{ a: 1 \n a }()";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);
    });

    it("should get label assigned in higher scope", function() {
      var code = "a: 1 \n { a }()";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);
    });

    it("should change value in inner scope", function() {
      var code = "a: 1 \n { a: 2 \n a }()";
      expect(v(code, c(p(code))).stack.pop()).toEqual(2);
    });

    it("should change value in outer scope if changed in inner scope", function() {
      var code = "a: 1 \n { a: 2 }() \n a";
      expect(v(code, c(p(code))).stack.pop()).toEqual(2);
    });

    it("should allow independent outer scope val if created after inner scope val", function() {
      var code = "{ a: 2 }() \n a: 1 \n a";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);
    });
  });

  describe("assignment", function() {
    it("should assign literal to env at top level", function() {
      var code = "a: 1 \n a";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);
    });

    it("should assign lambda to env at top level", function() {
      var code = "a: { 1 } \n a";
      var fn = v(code, c(p(code))).stack.pop();
      util.stripBc(fn.bc);
      expect(fn.bc).toEqual([["push", 1],
                             ["return"]]);
      expect(fn.ast).toBeDefined();
    });
  });

  describe("forever", function() {
    it("should run for a long time", function() {
      var code = "n: 1 \n forever { n: add(n 1) \n if equals(n 100) { blowup() } }";
      expect(function() {
        v(code, c(p(code)));
      }).toThrow("Cannot read property 'bc' of undefined");
    });
  });

  describe("conditionals", function() {
    it("should return first branch if true", function() {
      var code = "if true { 1 }";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);
    });

    it("should return else if if is true", function() {
      var code = "if false { 1 } else { 2 }";
      expect(v(code, c(p(code))).stack.pop()).toEqual(2);
    });

    it("should return undefined if false and no second branch", function() {
      var code = "if false { 1 }";
      expect(v(code, c(p(code))).stack.pop()).toBeUndefined();
    });

    it("should allow s-expression in branch", function() {
      var code = 'if true { print("hi") }';
      expect(v(code, c(p(code))).stack.pop()).toEqual("hi\n");
    });

    it("should return else if branch if condition true and if condition false", function() {
      var code = "if false { 1 } elseif true { 2 }";
      expect(v(code, c(p(code))).stack.pop()).toEqual(2);
    });

    it("should return if branch if condition true and else if condition true", function() {
      var code = "if true { 1 } elseif true { 2 }";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);
    });

    it("should return else branch if if and if else conditions false", function() {
      var code = "if false { 1 } elseif false { 2 } else { 3 }";
      expect(v(code, c(p(code))).stack.pop()).toEqual(3);
    });

    it("should return second else branch if true and prev conditions false", function() {
      var code = "if false { 1 } elseif false { 2 } elseif true { 3 }";
      expect(v(code, c(p(code))).stack.pop()).toEqual(3);
    });

    it("should not return else if previous condition is true", function() {
      var code = "if false { 1 } elseif true { 2 } else { 3 }";
      expect(v(code, c(p(code))).stack.pop()).toEqual(2);
    });

    it("should be able to run nested conditionals", function() {
      var code = "if true { if true { 1 } else { 2 } }";
      expect(v(code, c(p(code))).stack.pop()).toEqual(1);

      var code = "if true { if false { 1 } else { 2 } }";
      expect(v(code, c(p(code))).stack.pop()).toEqual(2);

      var code = "if false { if false { 1 } else { 2 } } else { 3 }";
      expect(v(code, c(p(code))).stack.pop()).toEqual(3);
    });
  });

  describe("recursion", function() {
    it("should trampoline a program where there is an if in the tail position", function() {
      var code = 'tozero: { ?x if equals(x 0) { "done" } else { tozero(subtract(x 1)) } } \n tozero(20000)';
      expect(v(code, c(p(code))).stack.pop()).toEqual("done");
    });
  });
});
