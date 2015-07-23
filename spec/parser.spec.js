var parse = require("../src/lang/parser.js");
var _ = require("underscore");
var util = require("../src/util");

describe("parser", function() {
  describe("atoms", function() {
    it("should parse an int", function() {
      expect(util.stripAst(util.getNodeAt(parse("1"), ["top", "do", 0, "return"])))
        .toEqual({ t: "number", c: 1 });

      expect(util.stripAst(util.getNodeAt(parse("123"), ["top", "do", 0, "return"])))
        .toEqual({ t: "number", c: 123 });
    });

    it("should parse a float", function() {
      var ast = parse("0.5");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do", 0, "return"])))
        .toEqual({ t: "number", c: 0.5 });
    });

    it("should parse a string", function() {
      var ast = parse('"hello my name is mary"');
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do", 0, "return"])))
        .toEqual({ t: "string", c: "hello my name is mary" });
    });

    it("should parse a label", function() {
      var ast = parse("person");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do", 0, "return"])))
        .toEqual({ t: "label", c: "person" });
    });

    it("should fail to pass a label that begins with an int", function() {
      expect(function() { parse("1abc") })
        .toThrow("Can't have a name that starts with a number")
    });
  });

  describe("top", function() {
    it("should allow an empty program", function() {
      var ast = parse("");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do"])))
        .toEqual([{ t: "return", c: { t: "undefined", c: undefined }  }]);
    });

    it("should allow a list of top level expressions on separate lines", function() {
      var ast = parse("print1()\nprint2()");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do"])))
        .toEqual([{ t: "invocation",
                    c: [{ t: "label", c: "print1" }]},
                  { t: "return", c: { t: "invocation",
                                     c: [{ t: "label", c: "print2" }]} }]);
    });
  });

  describe("do", function() {
    it("should not allow multiple expressions on same line of do block", function() {
      expect(function() { parse("1 1"); }).toThrow();
      expect(function() { parse("{}() {}()"); }).toThrow();
      expect(function() { parse("print() print()"); }).toThrow();
    });

    it("should allow space before expression", function() {
      var ast = parse(" 1");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do", 0, "return"])))
        .toEqual({ t: "number", c: 1 });
    });

    it("should allow nl AND SPACE separated expressions", function() {
      var ast = parse(" \n 1 \n 2 \n 3 ");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do"])))
        .toEqual([{ t: "number", c: 1 },
                  { t: "number", c: 2 },
                  { t: "return", c: { t: "number", c: 3 }}]);
    });

    it("should allow blank line with space", function() {
      var ast = parse(" 1 \n \n 2");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do"])))
        .toEqual([{ t: "number", c: 1 },
                  { t: "return", c: { t: "number", c: 2 }}]);
    });
  });

  describe("invocation", function() {
    it("shouldn't parse an invocation of nothing", function() {
      expect(function() { parse("()") }).toThrow();
    });

    it("should parse an invocation with no args", function() {
      var ast = parse("print()");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "invocation",
                    c: [{ t: "label", c: "print" }]});
    });

    it("should parse an invocation with two args", function() {
      var ast = parse("print(name height)");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "invocation",
                   c: [{ t: "label", c: "print" },
                       { t: "label", c: "name" },
                       { t: "label", c: "height" }]});
    });

    it("should parse an invocation on an arg that results from an invocation", function() {
      var ast = parse("print(get(shopping 1))");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do", 0, "return"])))
        .toEqual({ t: "invocation",
                   c: [{ t: "label", c: "print" },
                       { t: "invocation",
                         c: [{ t: "label", c: "get" },
                             { t: "label", c: "shopping" },
                             { t: "number", c: 1 }]}]});
    });

    it("should parse an invoked lambda with param and body and arg", function() {
      var ast = parse("{ ?a add(a) }(1)");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "invocation",
                   c: [{ t: "lambda",
                         c: [[{ t: "parameter", c: "a" }],
                             { t: "do",
                               c: [{ t: "return", c: { t: "invocation",
                                                       c: [{ t: "label", c: "add" },
                                                           { t: "label", c: "a" }]}}]}]},
                       { t: "number", c: 1 }]});
    });

    it("should allow args on different lines", function() {
      var ast = parse("print(add(1) \n subtract(2))");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do", 0, "return"])))
        .toEqual({ t: "invocation",
                   c: [{ t: "label", c: "print" },
                       { t: "invocation",
                         c: [{ t: "label", c: "add" },
                             { t: "number", c: 1 }]},
                       { t: "invocation",
                         c: [{ t: "label", c: "subtract" },
                             { t: "number", c: 2 }]}]});
    });

    it("should allow args on different lines surrounded by spaces", function() {
      var ast = parse("print( 1 \n 2 )");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do", 0, "return"])))
        .toEqual({ t: "invocation",
                   c: [{ t: "label", c: "print" },
                       { t: "number", c: 1 },
                       { t: "number", c: 2 }]});
    });

    it("should parse a double invocation", function() {
      var ast = parse("print()()");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "invocation",
                   c: [{ t: "invocation",
                         c: [{ t: "label", c: "print" }]}]});
    });

    it("should parse a quadruple invocation w args", function() {
      var ast = parse("print(1)(2)(3)(4)");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "invocation",
                   c: [{ t: "invocation",
                         c: [{ t: "invocation",
                               c: [{ t: "invocation",
                                     c: [{ t: "label", c: "print" },
                                         { t: "number", c: 1 }]},
                                   { t: "number", c: 2 }]},
                             { t: "number", c: 3 }]},
                       { t: "number", c: 4 }]});
    });


    it("should parse a lambda invocation that produces a lambda that is invoked", function() {
      var ast = parse("{ {} }()()");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "invocation",
                   c: [{ t: "invocation",
                         c: [{ t: "lambda",
                               c: [[], { t: "do",
                                         c: [{ t: "return",
                                               c: { t: "lambda",
                                                    c: [[],
                                                        { t: "do",
                                                          c: [{ t: "return",
                                                                c: { t: "undefined",
                                                                     c: undefined } }]}]}}]}]}]}]});
    });

    it("should be able to invoke result of conditional", function() {
      var ast = parse("if true { }()");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "invocation",
                   c: [{ t: "conditional",
                         c: [{ t: "boolean", c: true },
                             { t: "invocation",
                               c: [{ t: "lambda",
                                     c: [[], { t: "do",
                                               c: [{ t : 'return',
                                                     c : { t : 'undefined',
                                                           c : undefined } }] }] }] }]}]});
    });
  });

  describe("lambda", function() {
    it("should parse an uninvoked lambda with no params or body", function() {
      var ast = parse("{}");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do", 0, "return"])))
        .toEqual({ t: "lambda", c: [[], { t: "do", c: [{ t: "return",
                                                         c: { t: "undefined", c: undefined }  }]}]});
    });

    it("should parse an uninvoked lambda with two params and no body", function() {
      var ast = parse("{?name ?height}");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "lambda", c: [[{ t: "parameter", c: "name" },
                                     { t: "parameter", c: "height" }],
                                    { t: "do", c: [{ t: "return",
                                                     c: { t: "undefined", c: undefined }  }]}]});
    });

    it("should parse an uninvoked lambda with two params and two body exprs", function() {
      var ast = parse("{?a ?b add(a b)\nsubtract(c d)}");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "lambda", c: [[{ t: "parameter", c: "a" }, { t: "parameter", c: "b" }],
                                    { t: "do",
                                      c: [{ t: "invocation",
                                            c: [{ t: "label", c: "add" },
                                                { t: "label", c: "a" },
                                                { t: "label", c: "b" }]},
                                          { t: "return",
                                            c: { t: "invocation",
                                                 c: [{ t: "label", c: "subtract" },
                                                     { t: "label", c: "c" },
                                                     { t: "label", c: "d" }]}}]}]});

    });

    it("should allow newlines and spaces between every element of a lambda", function() {
      var ast = parse("{ \n ?a \n 1 \n 1 \n }");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "lambda", c: [[{ t: "parameter", c: "a" }],
                                    { t: "do", c: [{t: "number", c:1},
                                                   { t: "return", c: {t: "number", c:1}}]}]});

    });
  });

  describe("assignments", function() {
    it("should parse an assignment of a number", function() {
      var ast = parse("name: 1");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "assignment", c: [{ t: "label", c: "name" },
                                        { t: "number", c: 1}]});
    });

    it("should parse an assignment of a lambda", function() {
      var ast = parse("name: { ?a a }");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "assignment",
                   c: [{ t: "label", c: "name" },
                       { t: "lambda", c: [[{ t: "parameter", c: "a" }],
                                          { t: "do",
                                            c: [{ t: "return", c: { t: "label", c: "a" }}] }]}]});
    });

    it("should parse an assignment of an invocation of a lambda", function() {
      var ast = parse("name: { ?a a }(1)");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "assignment",
                   c: [{ t: "label", c: "name" },
                       { t: "invocation",
                         c: [{ t: "lambda",
                               c: [[{ t: "parameter", c: "a" }],
                                   { t: "do",
                                     c: [{ t: "return", c: { t: "label", c: "a" }}]}]},
                             { t: "number", c: 1 }]}]});
    });

    it("should parse an assignment of an invocation of a label", function() {
      var ast = parse("name: add(1)");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "assignment",
                   c: [{ t: "label", c: "name" },
                       { t: "invocation",
                         c: [{ t: "label", c: "add" },
                             { t: "number", c: 1 }]}]});
    });

    it("should allow space before expression after assignment", function() {
      var ast = parse('name: "Lauren"\n name');
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do"])))
        .toEqual([{ t: "assignment", c: [{ t: "label", c: "name" },
                                         { t: "string", c: "Lauren"}]},
                  { t: "return", c: { t: "label", c: "name" }}]);
    });
  });

  describe("conditional", function() {
    it("should parse an conditional with an if", function() {
      var ast = parse("if true { 1 }");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "conditional", c: [{ t: "boolean", c: true },
                                         { t: "invocation",
                                           c: [{ t: "lambda",
                                                 c: [[],
                                                     { t: "do",
                                                       c: [{ t: "return",
                                                             c: { t: "number", c: 1 }}]}]}]}]});
    });

    it("should parse an conditional with if and else if", function() {
      var ast = parse("if true { 1 } elseif false { 2 }");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "conditional", c: [{ t: "boolean", c: true },
                                         { t: "invocation",
                                           c: [{ t: "lambda",
                                                 c: [[], { t: "do",
                                                           c: [{ t: "return",
                                                                 c: { t: "number", c: 1 }}]}]}]},
                                         { t: "boolean", c: false },
                                         { t: "invocation",
                                           c: [{ t: "lambda",
                                                 c: [[], { t: "do",
                                                           c: [{ t: "return",
                                                                 c: { t: "number", c: 2 }}]}]}]}]});
    });

    it("should parse an conditional with an if, else if and else", function() {
      var ast = parse("if true { 1 } elseif false { 2 } else { 3 }");
      expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
        .toEqual({ t: "conditional",
                   c: [{ t: "boolean", c: true },
                       { t: "invocation",
                         c: [{ t: "lambda",
                               c: [[], { t: "do",
                                         c: [{ t: "return",
                                               c: { t: "number", c: 1 }}]}]}]},

                       { t: "boolean", c: false },
                       { t: "invocation",
                         c: [{ t: "lambda",
                               c: [[], { t: "do",
                                         c: [{ t: "return",
                                               c: { t: "number", c: 2 }}]}]}]},

                       { t: "boolean", c: true },
                       { t: "invocation",
                         c: [{ t: "lambda",
                               c: [[], { t: "do",
                                         c: [{ t: "return",
                                               c: { t: "number", c: 3 }}]}]}]}]});
    });

    it("should not allow else with condition", function() {
      expect(function() { parse("if true { 1 } else false { 2 }") }).toThrow();
    });

    it("should parse an conditional with if, two else ifs and else", function() {
      var ast = parse("if true { } elseif false { } elseif false { } else { }");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do", 0, "return"])))
        .toEqual({ t: "conditional",
                   c: [{ t: "boolean", c: true },
                       { t: "invocation",
                         c: [{ t: "lambda",
                               c: [[], { t: "do", c: [{ t: "return",
                                                        c: { t: "undefined",
                                                             c: undefined }  }]}]}]},

                       { t: "boolean", c: false },
                       { t: "invocation",
                         c: [{ t: "lambda",
                               c: [[], { t: "do", c: [{ t: "return",
                                                        c: { t: "undefined",
                                                             c: undefined }  }]}]}]},

                       { t: "boolean", c: false },
                       { t: "invocation",
                         c: [{ t: "lambda",
                               c: [[], { t: "do", c: [{ t: "return",
                                                        c: { t: "undefined",
                                                             c: undefined }  }]}]}]},

                       { t: "boolean", c: true },
                       { t: "invocation",
                         c: [{ t: "lambda",
                               c: [[], { t: "do", c: [{ t: "return",
                                                        c: { t: "undefined",
                                                             c: undefined }  }]}]}]}]});
    });

    it("should parse an conditional with if w invoked conditional", function() {
      var ast = parse("if really(true) { }");
      expect(util.stripAst(util.getNodeAt(ast,
                                          ["top", "do", 0, "return"])))
        .toEqual({ t: "conditional",
                   c: [{ t: "invocation",
                         c: [{ t: "label", c: "really" },
                             { t: "boolean", c: true }]},
                       { t: "invocation",
                         c: [{ t: "lambda", c: [[], { t: "do",
                                                      c: [{ t: "return",
                                                            c: { t: "undefined",
                                                                 c: undefined } }]}]}]}]});
    });
  });

  describe("balancing parentheses", function() {
    it("should mark single open w no close", function() {
      expect(function() { parse.balanceParentheses("{"); }).toThrow("Missing a closing }");
    });

    it("should mark open w no close preceded by some matched parens", function() {
      expect(function() { parse.balanceParentheses("{}()\n{"); })
        .toThrow("Missing a closing }");
    });

    it("should mark orphan close, not matched but separated open", function() {
      expect(function() { parse.balanceParentheses("{ ) }"); })
        .toThrow("Missing a preceding opening (");
    });

    it("should mark orphan close that is last char of input", function() {
      expect(function() { parse.balanceParentheses("{}())"); })
        .toThrow("Missing a preceding opening (");
    });

    it("should report the first orphan close", function() {
      expect(function() { parse.balanceParentheses("{}())\n{}())"); })
        .toThrow("Missing a preceding opening (");
    });

    it("should report the first extra open", function() {
      expect(function() { parse.balanceParentheses("{}(\n{}("); })
        .toThrow("Missing a closing )");
    });
  });

  describe("error messages", function() {
    it("should expect expression on same line to be preceded by nl", function() {
      expect(function() {
        parse("a bb");
      }).toThrow('Expected this to be on a new line');
    });

    it("should report that can't invoke literals", function() {
      expect(function() {
        parse("1()");
      }).toThrow("Can't run a number - it's not an action");
    });

    it("should expect fn name and application separated by space to be together", function() {
      expect(function() {
        parse("a ()");
      }).toThrow('There should be no spaces between\nthe name of the action and the ()');
    });

    it("should expect expression on same line nested in lambda to be preceded by nl", function() {
      expect(function() {
        parse("{ { a b } }");
      }).toThrow('Expected this to be on a new line');
    });

    it("should report missing value in assignment at end of input", function() {
      expect(function() {
        parse("a: ");
      }).toThrow("You have specified a name, but you also need a value");
    });

    it("should report missing value in assignment followed by newline", function() {
      expect(function() {
        parse("a: \n");
      }).toThrow("You have specified a name, but you also need a value");
    });

    it("should report missing label in assignment", function() {
      expect(function() {
        parse(": 1");
      }).toThrow("You have specified a value, but you also need a label");
    });

    it("should report missing label in assignment after parsed expr", function() {
      // regression test
      expect(function() {
        parse("a: 1\n: 1");
      }).toThrow("You have specified a value, but you also need a label");
    });
  });

  describe("offset annotation", function() {
    it("should put start offset on every node with a .c attribute", function() {
      parse.verifyAllAstNodesHaveStartIndex(parse("{?a ?b add(a b)\nsubtract(c d)}"));
    });
  });

  describe("tail expression annotation", function() {
    it("should annotate tail lambda invocation as a tail call", function() {
      var ast = parse("{}()");
      var tailCall = util.getNodeAt(ast, ["top", "do", 0, "return"]);
      expect(tailCall.t).toEqual("invocation");
      expect(tailCall.tail).toEqual(true);
    });

    it("should annotate both tail if and wrapped tail inv", function() {
      var ast = parse("if true { {}() }");

      var ifInvocation = util.getNodeAt(ast, ["top", "do", 0, "return", "conditional", 1]);
      expect(ifInvocation.t).toEqual("invocation");
      expect(ifInvocation.tail).toEqual(true);

      var lambdaInvocation = util.getNodeAt(ifInvocation,
                                            ["invocation", 0, "lambda", 1, "do", 0, "return"]);
      expect(lambdaInvocation.t).toEqual("invocation");
      expect(lambdaInvocation.tail).toEqual(true);
    });

    it("should annotate tail if, wrapped if and wrapped tail inv", function() {
      var ast = parse("if true { if true { {}() } }");

      var ifInvocation1 = util.getNodeAt(ast, ["top", "do", 0, "return", "conditional", 1]);
      expect(ifInvocation1.t).toEqual("invocation");
      expect(ifInvocation1.tail).toEqual(true);

      var ifInvocation2 = util.getNodeAt(ifInvocation1,
                                         ["invocation", 0, "lambda", 1, "do", 0, "return",
                                          "conditional", 1]);
      expect(ifInvocation2.t).toEqual("invocation");
      expect(ifInvocation2.tail).toEqual(true);

      var lambdaInvocation = util.getNodeAt(ifInvocation2,
                                            ["invocation", 0, "lambda", 1, "do", 0, "return"]);
      expect(lambdaInvocation.t).toEqual("invocation");
      expect(lambdaInvocation.tail).toEqual(true);
    });

    it("should mark tail inv but not the invocation passed to it", function() {
      var ast = parse("a(b())");

      var tailCall = util.getNodeAt(ast, ["top", "do", 0, "return"]);
      expect(tailCall.t).toEqual("invocation");
      expect(tailCall.tail).toEqual(true);

      var nonTailCall = util.getNodeAt(tailCall, ["invocation", 1]);
      expect(nonTailCall.t).toEqual("invocation");
      expect(nonTailCall.tail).toBeUndefined();
    });

    it("should mark tail inv and all chained invs", function() {
      var ast = parse("a()()()");

      var tailCall1 = util.getNodeAt(ast, ["top", "do", 0, "return"]);
      expect(tailCall1.t).toEqual("invocation");
      expect(tailCall1.tail).toEqual(true);

      var tailCall2 = tailCall1.c[0];
      expect(tailCall2.t).toEqual("invocation");
      expect(tailCall2.tail).toEqual(true);

      var tailCall3 = tailCall2.c[0];
      expect(tailCall3.t).toEqual("invocation");
      expect(tailCall3.tail).toEqual(true);
    });

    it("should annotate inv in if and else as tail call", function() {
      var ast = parse("if true { {}() } else { {}() }");

      var ifInvocation = util.getNodeAt(ast, ["top", "do", 0, "return", "conditional", 1]);
      expect(ifInvocation.t).toEqual("invocation");
      expect(ifInvocation.tail).toEqual(true);

      var lambdaInv = util.getNodeAt(ifInvocation,
                                     ["invocation", 0, "lambda", 1, "do", 0, "return"]);
      expect(lambdaInv.t).toEqual("invocation");
      expect(lambdaInv.tail).toEqual(true);

      var elseInvocation = util.getNodeAt(ast, ["top", "do", 0, "return", "conditional", 3]);
      expect(elseInvocation.t).toEqual("invocation");
      expect(elseInvocation.tail).toEqual(true);
    });

    it("should second do expr as tail but not first", function() {
      var ast = parse("a() \n b()");

      var nonTailCall = util.getNodeAt(ast, ["top", "do", 0]);
      expect(nonTailCall.t).toEqual("invocation");
      expect(nonTailCall.tail).toBeUndefined();

      var tailCall = util.getNodeAt(ast, ["top", "do", 1, "return"]);
      expect(tailCall.t).toEqual("invocation");
      expect(tailCall.tail).toEqual(true);
    });
  });

  describe("end index annotation", function() {
    it("should annotate a literal with end positions", function() {
      var ast = parse("50");

      expect(util.getNodeAt(ast, ["top", "do", 0, "return"]).e).toEqual(2);
      expect(util.getNodeAt(ast, ["top", "do", 0]).e).toEqual(2);
      expect(util.getNodeAt(ast, ["top"]).e).toEqual(2);
      expect(ast.e).toEqual(2);
    });

    it("should annotate an assignment with end positions", function() {
      var ast = parse("a: 50");

      expect(util.getNodeAt(ast, ["top", "do", 0, "return", "assignment", 1]).e).toEqual(5);
      expect(util.getNodeAt(ast, ["top", "do", 0, "return", "assignment", 0]).e).toEqual(1);
      expect(util.getNodeAt(ast, ["top", "do", 0, "return"]).e).toEqual(5);
      expect(util.getNodeAt(ast, ["top", "do", 0]).e).toEqual(5);
      expect(util.getNodeAt(ast, ["top"]).e).toEqual(5);
      expect(ast.e).toEqual(5);
    });

    it("should annotate a lambda literal with end positions", function() {
      var ast = parse("{ a() }");

      expect(util.getNodeAt(ast, ["top", "do", 0, "return", "lambda", 1]).e).toEqual(6);
      expect(util.getNodeAt(ast, ["top", "do", 0, "return"]).e).toEqual(7);
      expect(util.getNodeAt(ast, ["top", "do", 0]).e).toEqual(7);
      expect(util.getNodeAt(ast, ["top"]).e).toEqual(7);
      expect(ast.e).toEqual(7);
    });

    it("should annotate a subsequent line in a do block with end positions", function() {
      var ast = parse("{ } \n\n 5");
      expect(util.getNodeAt(ast, ["top", "do", 1, "return"]).e).toEqual(8);
      expect(util.getNodeAt(ast, ["top", "do", 1]).e).toEqual(8);
      expect(util.getNodeAt(ast, ["top"]).e).toEqual(8);
      expect(ast.e).toEqual(8);
    });
  });
});
