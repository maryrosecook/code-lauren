var im = require("immutable");

var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var util = require("../src/util");

describe("bytecode compiler", function() {
  describe("top level", function() {
    it("should compile an empty program", function() {
      expect(util.stripBc(c(p(""))))
        .toEqual([["push", undefined],
                  ["return"]]);
    });

    it("should compile a program that returns 1", function() {
      expect(util.stripBc(c(p("1"))))
        .toEqual([["push", 1],
                  ["return"]]);
    });

    it("should compile a program that has two expressions and returns the second", function() {
      expect(util.stripBc(c(p("1\n2"))))
        .toEqual([["push", 1],
                  ["pop"],
                  ["push", 2],
                  ["return"]]);
    });
  });

  describe("assignments", function() {
    it("should compile an assignment", function() {
      expect(util.stripBc(c(p("a: 1"))))
        .toEqual([["push", 1],
                  ["set_env", "a"],
                  ["pop"],
                  ["return"]]);
    });
  });

  describe("forever", function() {
    it("should not annotate invoke", function() {
      var bc = c(p("forever {}"));
      expect(bc[2][0]).toEqual("invoke");
      expect(bc[2].annotate).toEqual(false);
    });
  });

  describe("conditionals", function() {
    it("should compile an if", function() {
      expect(util.stripBc(c(p("if true { 1 }"))))
        .toEqual([["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 2],

                  ["push", undefined],
                  ["jump", 0],

                  ["return"]]);

    });

    it("should compile an if/else", function() {
      expect(util.stripBc(c(p("if true { 1 } else { 2 }"))))
        .toEqual([["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 8],

                  ["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 2],

                  ["push", undefined],
                  ["jump", 0],

                  ["return"]]);

    });

    it("should compile an if/elseif/else", function() {
      expect(util.stripBc(c(p("if true { 1 } elseif false { 2 } else { 3 }"))))
        .toEqual([["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 14],

                  ["push", false],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 8],

                  ["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 3],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 2],

                  ["push", undefined],
                  ["jump", 0],

                  ["return"]]);

    });

    it("should compile an if/elseif/elseif/else", function() {
      expect(util.stripBc(c(p("if true { 1 } elseif false { 2 } elseif true { 3 } else { 4 }"))))
        .toEqual([["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 20],

                  ["push", false],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 14],

                  ["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 3],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 8],

                  ["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 4],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 2],

                  ["push", undefined],
                  ["jump", 0],

                  ["return"]]);
    });

    it("should compile an if/elseif/elseif/else", function() {
      expect(util.stripBc(c(p("if true { 1 } elseif false { 2 }"))))
        .toEqual([["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 8],
                  ["push", false],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]] }],
                  ["invoke", 0, true],
                  ["jump", 2],

                  ["push", undefined],
                  ["jump", 0],

                  ["return"]]);

    });
  });

  describe("lambdas", function() {
    it("should compile an empty lambda", function() {
      expect(util.stripBc(c(util.getNodeAt(p("{}"), ["top", "do", 0, "return"]))[0][1]
                          .get("bc")))
        .toEqual([["push", undefined],
                  ["return"]]);
    });

    it("should compile a lambda that returns 1", function() {
      expect(util.stripBc(c(util.getNodeAt(p("{ 1 }"), ["top", "do", 0, "return"]))[0][1]
                          .get("bc")))
        .toEqual([["push", 1],
                  ["return"]]);
    });

    it("should compile lambda that has 2 expressions and returns the second", function() {
      expect(util.stripBc(c(util.getNodeAt(p("{ 1 \n 2 }"), ["top", "do", 0, "return"]))[0][1]
                          .get("bc")))
        .toEqual([["push", 1],
                  ["pop"],
                  ["push", 2],
                  ["return"]]);
    });

    it("should compile lambda that contains an invocation on no arguments", function() {
      expect(util.stripBc(c(util.getNodeAt(p("{ a() }"), ["top", "do", 0, "return"]))[0][1]
                          .get("bc")))
        .toEqual([["arg_start"],
                  ["get_env", "a"],
                  ["invoke", 0, true],
                  ["return"]]);
    });

    it("should compile lambda that contains an invocation with some arguments", function() {
      expect(util.stripBc(c(util.getNodeAt(p("{ a(1 2) }"), ["top", "do", 0, "return"]))[0][1]
                          .get("bc")))
        .toEqual([["arg_start"],
                  ["push", 1],
                  ["push", 2],
                  ["get_env", "a"],
                  ["invoke", 2, true],
                  ["return"]]);
    });

    it("should compile invocation of lambda literal", function() {
      var code = util.stripBc(c(util.getNodeAt(p("{ {}() }"),
                                               ["top", "do", 0, "return"]))[0][1].get("bc"));
      expect(code).toEqual([["arg_start"],
                            ["push_lambda", { bc: [["push", undefined],
                                                   ["return"]] }],
                            ["invoke", 0, true],
                            ["return"]]);
    });
  });
});
