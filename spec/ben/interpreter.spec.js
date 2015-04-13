var r = require("../../src/runner");

var standardEnv = require("../../src/lang/ben/standard-library");

describe("interpreter", function() {
  describe("env", function() {
    it("should be able to interpret if no env passed in", function() {
      expect(r.complete(r("1"))).toEqual(1);
    });
  });

  describe("literals", function() {
    it("should be able to produce a number", function() {
      expect(r.complete(r(("1")))).toEqual(1);
    });

    it("should be able to produce a string", function() {
      expect(r.complete(r(('"my name is ben"')))).toEqual("my name is ben");
    });
  });

  describe("fn invocation", function() {
    describe("library fns", function() {
      it("should be able to call a library fn with no args", function() {
        expect(r.complete(r(('(print)')))).toEqual("\n");
      });

      it("should be able to call a library fn with some args", function() {
        expect(r.complete(r(('(add 1 2 3)')))).toEqual(6);
      });

      it("should be able to invoke all invocations", function() {
        expect(r.complete(r('(print "a") (print "b")'))).toEqual("b\n");
      });

      it("should be able to call fn that uses thet result of invocation as arg", function() {
        expect(r.complete(r(('(add 1 (add 2 3) 4)')))).toEqual(10);
      });

    });

    describe("lambdas", function() {
      it("should be able to invoke a lambda on no args", function() {
        expect(r.complete(r('({ 1 })'))).toEqual(1);
      });

      it("should be able to invoke a lambda on several args used in the lambda", function() {
        expect(r.complete(r('({?a ?b (add a b)} 1 2)'))).toEqual(3);
      });
    });
  });

  describe("do blocks", function() {
    it("should return last expression in a do block", function() {
      expect(r.complete(r("1\n2\n3"))).toEqual(3);
    });
  });

  describe("let blocks", function() {
    it("should return last expression in a let block", function() {
      expect(r.complete(r("(let [] 1\n2\n3)"))).toEqual(3);
    });

    it("should allow usage of a binding in the body", function() {
      expect(r.complete(r("(let [a 1] 2\na)"))).toEqual(1);
    });

    it("should allow letrec behaviour of bindings", function() {
      expect(r.complete(r("(let [a 1\nb (add a 1)\nc (add b 1)] c)"))).toEqual(3);
    });

    it("should allow let lambda to be run in body", function() {
      expect(r.complete(r("(let [f { ?a (add a 1) }] (f 1))"))).toEqual(2);
    });
  });

  describe("if", function() {
    it("should return first branch if true", function() {
      expect(r.complete(r("(if true 1 2)"))).toEqual(1);
    });

    it("should return second branch if false", function() {
      expect(r.complete(r("(if false 1 2)"))).toEqual(2);
    });

    it("should allow s-expression in first branch", function() {
      expect(r.complete(r('(if true (print "hi") 2)'))).toEqual("hi\n");
    });

    it("should allow s-expression in second branch", function() {
      expect(r.complete(r('(if false 2 (print "hi"))'))).toEqual("hi\n");
    });
  });

  // describe("recursion", function() {
  //   it("should allow function to recurse", function() {
  //     expect(function() {
  //       run('(let [b { (b) }] (b))')
  //     }).toThrow("Maximum call stack size exceeded");
  //   });
  // });
});
