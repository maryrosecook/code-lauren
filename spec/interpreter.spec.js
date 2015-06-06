var i = require("../src/lang/interpreter");
var scope = require("../src/lang/scope");
var standardLibrary = require("../src/lang/standard-library");

var p = require("../src/lang/parser");
var r = require("../src/runner");
var c = r.complete;
var step = r.step;

describe("interpreter", function() {
  describe("env", function() {
    it("should be able to interpret if no env passed in", function() {
      expect(c(r(p("1")))).toEqual(1);
    });
  });

  describe("literals", function() {
    it("should be able to produce a number", function() {
      expect(c(r(p("1")))).toEqual(1);
    });

    it("should be able to produce a string", function() {
      expect(c(r(p('"hi my name is lauren"')))).toEqual("hi my name is lauren");
    });

    it("should be able to produce a string", function() {
      expect(c(r(p("true")))).toEqual(true);
    });
  });

  describe("pausing execution", function() {
    it("should be able to pause before execution of a lambda", function() {
      var g = r(p("{1}({2}())"));
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(1);
    });
  });

  describe("fn invocation", function() {
    describe("library fns", function() {
      it("should be able to call a library fn with no args", function() {
        expect(c(r(p(('print()'))))).toEqual("\n");
      });

      it("should be able to call a library fn with some args", function() {
        expect(c(r(p('add(1 2 3)')))).toEqual(6);
      });

      it("should be able to invoke all invocations", function() {
        expect(c(r(p('print("a")\nprint("b")')))).toEqual("b\n");
      });

      it("should be able to call fn that uses thet result of invocation as arg", function() {
        expect(c(r(p('add(1 add(2 3) 4)')))).toEqual(10);
      });
    });

    describe("lambdas", function() {
      it("should be able to invoke a lambda on no args", function() {
        expect(c(r(p('{ 1 }()')))).toEqual(1);
      });

      it("should be able to run a function that takes a param", function() {
        expect(c(r(p('{?a 1}(5)')))).toEqual(1);
      });

      it("should be able use an arg passed to a lambda", function() {
        expect(c(r(p('{?a a}(1)')))).toEqual(1);
      });

      it("should be able to invoke a lambda on several args used in the lambda", function() {
        expect(c(r(p('{?a ?b add(a b)}(1 2)')))).toEqual(3);
      });

      it("should be able to call a lambda nested many layers deep", function() {
        expect(c(r(p('{ { { 1 } } }()()()')))).toEqual(1);
      });

      it("should be able to execute lambda on arg from lambda invocation", function() {
        expect(c(r(p("{1}({2}())")))).toEqual(1);
      });
    });
  });

  describe("do blocks", function() {
    it("should be able to run an empty program", function() {
      expect(c(r(p("")))).toBeUndefined();
    });

    it("should return last expression in a top level do block", function() {
      expect(c(r(p("1\n2\n3")))).toEqual(3);
    });

    it("should return last expression in a lambda do block", function() {
      expect(c(r(p("{ 1\n2\n3 }()")))).toEqual(3);
    });

    it("should call all expressions in a top level do block", function() {
      var lib = standardLibrary();
      var callCount = 0;
      lib.called = function*() {
        callCount += 1;
      };

      var env = scope(lib);

      c(r(p("called()\ncalled()"), env));
      expect(callCount).toEqual(2);
    });

    it("should call all expressions in a lambda do block", function() {
      var lib = standardLibrary();
      var callCount = 0;
      lib.called = function*() {
        callCount += 1;
      };

      var env = scope(lib);

      c(r(p("{ called()\ncalled() }()"), env));
      expect(callCount).toEqual(2);
    });
  });

  describe("assignments", function() {
    it("should return value assigned from assignment expression", function() {
      expect(c(r(p("name: 1")))).toEqual(1);
    });

    it("should allow usage of bound value in top level", function() {
      expect(c(r(p('name: "Lauren"\n  name')))).toEqual("Lauren");
    });

    it("should not allow usage of bound value before binding in top level", function() {
      var lib = standardLibrary();
      var callCount = 0;
      lib.pass = function*(name) {
        expect(name).toBeUndefined();
        callCount = 1;
      };

      var env = scope(lib);

      c(r(p('pass(name)\nname: "Lauren"'), env));
      expect(callCount).toEqual(1);
    });

    it("should allow usage of bound value in invoked lambda", function() {
      expect(c(r(p('{ name: "Lauren"\n  name }()')))).toEqual("Lauren");
    });

    it("should not allow usage of bound value before binding in invoked lambda", function() {
      var lib = standardLibrary();
      var callCount = 0;
      lib.pass = function*(name) {
        expect(name).toBeUndefined();
        callCount = 1;
      };

      var env = scope(lib);

      c(r(p('{ pass(name)\nname: "Lauren" }()'), env));
      expect(callCount).toEqual(1);
    });
  });

  describe("if", function() {
    it("should return first branch if true", function() {
      expect(c(r(p("if true { 1 }")))).toEqual(1);
    });

    it("should return else if if is true", function() {
      expect(c(r(p("if false { 1 } else { 2 }")))).toEqual(2);
    });

    it("should return undefined if false and no second branch", function() {
      expect(c(r(p("if false { 1 }")))).toBeUndefined();
    });

    it("should allow s-expression in branch", function() {
      expect(c(r(p('if true { print("hi") }')))).toEqual("hi\n");
    });

    it("should return else if branch if condition true and if condition false", function() {
      expect(c(r(p('if false { 1 } elseif true { 2 }')))).toEqual(2);
    });

    it("should return if branch if condition true and else if condition true", function() {
      expect(c(r(p('if true { 1 } elseif true { 2 }')))).toEqual(1);
    });

    it("should return else branch if if and if else conditions false", function() {
      expect(c(r(p('if false { 1 } elseif false { 2 } else { 3 }')))).toEqual(3);
    });

    it("should return second else branch if true and prev conditions false", function() {
      expect(c(r(p('if false { 1 } elseif false { 2 } elseif true { 3 }')))).toEqual(3);
    });

    it("should not return else if previous condition is true", function() {
      expect(c(r(p('if false { 1 } elseif true { 2 } else { 3 }')))).toEqual(2);
    });
  });

  describe("recursion", function() {
    it("should allow function to recurse a few times", function() {
      var lib = standardLibrary();
      var callCount = 0;
      lib.called = function*() {
        callCount += 1;
      };

      var env = scope(lib);

      c(r(p('b: { ?x called()\nif less-than(x 5) { b(add(x 1)) } }\nb(0)'), env));
      expect(callCount).toEqual(6);
    });

    it("should trampoline a program where there is an if in the tail position", function() {
      expect(c(r(p('countto: { ?x if greater-than(x 0) { countto(subtract(x 1) y) } else { "done"} }\ncountto(20000)')))).toEqual("done");
    });
  });
});
