var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var util = require("../src/util");

// just removes ast attribute values from fn objects for easier expectation writing
function stripFnAsts(bc) {
  bc.forEach(function(instruction) {
    if (instruction[0] === "push" && typeof instruction[1] === 'object') {
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
        .toEqual([["load_name", "a"],
                  ["invoke"],
                  ["return"]]);
    });

    it("should compile invocation of lambda literal", function() {
      var code = stripFnAsts(c(util.getNodeAt(p("{ {}() }"),
                                              ["top", "do", 0, "return"]))[0][1].bc);

      expect(code).toEqual([["push", { bc: [["push", undefined], ["return"]] }],
                            ["invoke"],
                            ["return"]]);
    });
  });
});
