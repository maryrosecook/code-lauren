var i = require("../src/lang/interpreter");
var standardLibrary = require("../src/lang/standard-library");

var r = require("../src/runner");
var c = r.complete;
var step = r.step;

describe("interpreter", function() {
  describe("env", function() {
    it("should be able to interpret if no env passed in", function() {
      expect(c(r("1"))).toEqual(1);
    });
  });

  describe("literals", function() {
    it("should be able to produce a number", function() {
      expect(c(r("1"))).toEqual(1);
    });

    it("should be able to produce a string", function() {
      expect(c(r('"hi my name is lauren"'))).toEqual("hi my name is lauren");
    });

    it("should be able to produce a string", function() {
      expect(c(r("true"))).toEqual(true);
    });
  });

  describe("pausing execution", function() {
    it("should be able to pause before execution of a lambda", function() {
      var g = r("({1} ({2}))");
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(null);
      expect(step(g)).toEqual(1);
    });
  });

  describe("fn invocation", function() {
    describe("library fns", function() {
      it("should be able to call a library fn with no args", function() {
        expect(c(r(('(print)')))).toEqual("\n");
      });

      it("should be able to call a library fn with some args", function() {
        expect(c(r(('(add 1 2 3)')))).toEqual(6);
      });

      it("should be able to invoke all invocations", function() {
        expect(c(r('(print "a") (print "b")'))).toEqual("b\n");
      });

      it("should be able to call fn that uses thet result of invocation as arg", function() {
        expect(c(r(('(add 1 (add 2 3) 4)')))).toEqual(10);
      });
    });

    describe("lambdas", function() {
      it("should be able to instantiate and invoke an empty lambda", function() {
        expect(c(r(""))).toBeUndefined();
      });

      it("should be able to instantiate and invoke lambda w one atom in it", function() {
        expect(c(r("1"))).toEqual(1);
      });

      it("should be able to invoke a lambda on no args", function() {
        expect(c(r('({ 1 })'))).toEqual(1);
      });

      it("should be able to invoke a lambda on no args", function() {
        expect(c(r('1'))).toEqual(1);
      });

      it("should be able to run a function that takes a param", function() {
        expect(c(r('({?a 1} 5)'))).toEqual(1);
      });

      it("should be able use an arg passed to a lambda", function() {
        expect(c(r('({?a a} 1)'))).toEqual(1);
      });

      it("should be able to invoke a lambda on several args used in the lambda", function() {
        expect(c(r('({?a ?b (add a b)} 1 2)'))).toEqual(3);
      });

      it("should be able to call lambda nested many layers deep", function() {
        expect(c(r('({ ({ ({ ({ 1 }) }) }) })'))).toEqual(1);
      });
    });
  });

  describe("do blocks", function() {
    it("should be able to run an empty program", function() {
      expect(c(r(""))).toBeUndefined();
    });

    it("should return last expression in a do block", function() {
      expect(c(r("1\n2\n3"))).toEqual(3);
    });

    it("should call all expressions in a do block", function() {
      var lib = standardLibrary();
      var callCount = 0;
      lib.called = function*() {
        callCount += 1;
      };

      var env = i.createScope(lib);

      c(r("({ (called) (called) })", env));
      expect(callCount).toEqual(2);
    });
  });

  describe("name blocks", function() {
    it("should return last expression in a name block", function() {
      expect(c(r("(name [] 1\n2\n3)"))).toEqual(3);
    });

    it("should allow usage of a binding in the body", function() {
      expect(c(r("(name [a 1] 2\na)"))).toEqual(1);
    });

    it("should allow letrec behaviour of bindings", function() {
      expect(c(r("(name [a 1\nb (add a 1)\nc (add b 1)] c)"))).toEqual(3);
    });

    it("should allow name lambda to be run in body", function() {
      expect(c(r("(name [f { ?a (add a 1) }] (f 1))"))).toEqual(2);
    });
  });

  describe("if", function() {
    it("should return first branch if true", function() {
      expect(c(r("(if true 1 2)"))).toEqual(1);
    });

    it("should return second branch if false", function() {
      expect(c(r("(if false 1 2)"))).toEqual(2);
    });

    it("should return undefined if false and no second branch", function() {
      expect(c(r("(if false 1)"))).toBeUndefined();
    });

    it("should return first branch if true and no second branch", function() {
      expect(c(r("(if true 1)"))).toEqual(1);
    });

    it("should allow s-expression in first branch", function() {
      expect(c(r('(if true (print "hi") 2)'))).toEqual("hi\n");
    });

    it("should allow s-expression in second branch", function() {
      expect(c(r('(if false 2 (print "hi"))'))).toEqual("hi\n");
    });
  });

  describe("recursion", function() {
    it("should allow function to recurse a few times", function() {
      var lib = standardLibrary();
      var callCount = 0;
      lib.called = function*() {
        callCount += 1;
      };

      var env = i.createScope(lib);

      c(r('(name [b { ?x (called) (if (less-than x 5) (b (add x 1))) }] (b 0))', env));
      expect(callCount).toEqual(6);
    });

    it("should allow recursion > 18000 times because of trampolining", function() {
      expect(function() {
        var lib = standardLibrary();
        lib.done = function*(n) {
          if (n > 18000) {
            throw "Made it to 18000";
          }
        };

        var env = i.createScope(lib);
        c(r('(name [b { ?n (done n) (b (add n 1)) }] (b 0))', env));
      }).toThrow("Made it to 18000");
    });

    it("should trampoline a program where there is an if in the tail position", function() {
      expect(c(r('(name [countto { ?x (if (greater-than x 0) (countto (subtract x 1) y) "done") }] (countto 20000))'))).toEqual("done");
    });

    it("should trampoline a program where there is name block in tail position", function() {
      expect(c(r('(name [countto { ?x (name [] (if (greater-than x 0) (countto (subtract x 1) y) "done")) }] (countto 20000))'))).toEqual("done");
    });
  });
});
