var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var util = require("../src/util");

// just removes ast attribute values from fn objects for easier expectation writing
function stripFnAsts(bc) {
  bc.forEach(function(instruction) {
    if (instruction[0] === "push_lambda") {
      delete instruction[1].ast;
    }
  });

  return bc;
};

describe("bytecode compiler", function() {
  describe("top level", function() {
    it("should compile an empty program", function() {
      expect(c(p("")))
        .toEqual([["push", undefined],
                  ["return"]]);
    });

    it("should compile a program that returns 1", function() {
      expect(c(p("1")))
        .toEqual([["push", 1],
                  ["return"]]);
    });

    it("should compile a program that has two expressions and returns the second", function() {
      expect(c(p("1\n2")))
        .toEqual([["push", 1],
                  ["pop"],
                  ["push", 2],
                  ["return"]]);
    });
  });

  describe("assignments", function() {
    it("should compile an assignment", function() {
      expect(c(p("a: 1")))
        .toEqual([["push", 1],
                  ["set_env", "a"],
                  ["pop"],
                  ["return"]]);
    });
  });

  describe("conditionals", function() {
    it("should compile an if", function() {
      expect(stripFnAsts(c(p("if true { 1 }"))))
        .toEqual([["push", true],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 0],

                  ["return"]]);
    });

    it("should compile an if/else", function() {
      expect(stripFnAsts(c(p("if true { 1 } else { 2 }"))))
        .toEqual([["push", true],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 5],

                  ["push", true],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 0],

                  ["return"]]);
    });

    it("should compile an if/elseif/else", function() {
      expect(stripFnAsts(c(p("if true { 1 } elseif false { 2 } else { 3 }"))))
        .toEqual([["push", true],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 10],

                  ["push", false],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 5],

                  ["push", true],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 3],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 0],

                  ["return"]]);
    });

    it("should compile an if/elseif/elseif/else", function() {
      expect(stripFnAsts(c(p("if true { 1 } elseif false { 2 } elseif true { 3 } else { 4 }"))))
        .toEqual([["push", true],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 15],

                  ["push", false],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 10],

                  ["push", true],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 3],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 5],

                  ["push", true],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 4],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 0],

                  ["return"]]);
    });

    it("should compile an if/elseif/elseif/else", function() {
      expect(stripFnAsts(c(p("if true { 1 } elseif false { 2 }"))))
        .toEqual([["push", true],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 5],
                  ["push", false],
                  ["if_not_true_jump", 3],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]] }],
                  ["invoke", 0],
                  ["jump", 0],

                  ["return"]]);
    });
  });

  describe("lambdas", function() {
    it("should compile an empty lambda", function() {
      expect(c(util.getNodeAt(p("{}"), ["top", "do", 0, "return"]))[0][1].bc)
        .toEqual([["push", undefined],
                  ["return"]]);
    });

    it("should compile a lambda that returns 1", function() {
      expect(c(util.getNodeAt(p("{ 1 }"), ["top", "do", 0, "return"]))[0][1].bc)
        .toEqual([["push", 1],
                  ["return"]]);
    });

    it("should compile lambda that has 2 expressions and returns the second", function() {
      expect(c(util.getNodeAt(p("{ 1 \n 2 }"), ["top", "do", 0, "return"]))[0][1].bc)
        .toEqual([["push", 1],
                  ["pop"],
                  ["push", 2],
                  ["return"]]);
    });

    it("should compile lambda that contains an invocation on no arguments", function() {
      expect(c(util.getNodeAt(p("{ a() }"), ["top", "do", 0, "return"]))[0][1].bc)
        .toEqual([["get_env", "a"],
                  ["invoke", 0],
                  ["return"]]);
    });

    it("should compile lambda that contains an invocation with some arguments", function() {
      expect(c(util.getNodeAt(p("{ a(1 2) }"), ["top", "do", 0, "return"]))[0][1].bc)
        .toEqual([["push", 1],
                  ["push", 2],
                  ["get_env", "a"],
                  ["invoke", 2],
                  ["return"]]);
    });

    it("should compile invocation of lambda literal", function() {
      var code = stripFnAsts(c(util.getNodeAt(p("{ {}() }"),
                                              ["top", "do", 0, "return"]))[0][1].bc);

      expect(code).toEqual([["push_lambda", { bc: [["push", undefined],
                                                   ["return"]] }],
                            ["invoke", 0],
                            ["return"]]);
    });
  });
});
