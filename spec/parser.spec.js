var parse = require("../src/lang/parser.js");
var _ = require("underscore");
var util = require("../src/util");

function getNodeAt(node, keys) {
  var nextKey = keys[0];
  if (keys.length === 0) {
    return node;
  } else if (_.isArray(node) && nextKey in node) {
    return getNodeAt(node[nextKey], _.rest(keys));
  } else if (_.isObject(node) && node.t === nextKey) {
    return getNodeAt(node.c, _.rest(keys));
  } else {
    throw "Couldn't find node with key " + nextKey;
  }
};

describe("parser", function() {
  describe("atoms", function() {
    it("should parse an int", function() {
      var ast = parse("1");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "number", c: 1 });
    });

    it("should parse a float", function() {
      var ast = parse("0.5");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "number", c: 0.5 });
    });

    it("should parse a string", function() {
      var ast = parse('"hello my name is mary"');
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "string", c: "hello my name is mary" });
    });

    it("should parse a label", function() {
      var ast = parse("person");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "label", c: "person" });
    });
  });

  describe("top", function() {
    it("should allow an empty program", function() {
      var ast = parse("");
      expect(util.stripAst(getNodeAt(ast, ["top", "do"])))
        .toEqual([]);
    });

    it("should allow a list of top level expressions on separate lines", function() {
      var ast = parse("print()\nprint()");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do"])))
        .toEqual([{ t: "invocation",
                    c: [{ t: "label", c: "print" }]},
                  { t: "invocation",
                    c: [{ t: "label", c: "print" }]}]);
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
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "number", c: 1 });
    });

    it("should allow nl AND SPACE separated expressions", function() {
      var ast = parse(" \n 1 \n 2 \n 3 ");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do"])))
        .toEqual([{ t: "number", c: 1 },
                  { t: "number", c: 2 },
                  { t: "number", c: 3 }]);
    });

    it("should allow blank line with space", function() {
      var ast = parse(" 1 \n \n 2");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do"])))
        .toEqual([{ t: "number", c: 1 },
                  { t: "number", c: 2 }]);
    });
  });

  describe("invocation", function() {
    it("shouldn't parse an invocation of nothing", function() {
      expect(function() { parse("()") }).toThrow();
    });

    it("should parse an invocation with no args", function() {
      var ast = parse("print()");
      expect(util.stripAst(getNodeAt(ast, ["top", "do"])))
        .toEqual([{ t: "invocation",
                    c: [{ t: "label", c: "print" }]}]);
    });

    it("should parse an invocation with two args", function() {
      var ast = parse("print(name height)");
      expect(util.stripAst(getNodeAt(ast, ["top", "do", 0])))
        .toEqual({ t: "invocation",
                   c: [{ t: "label", c: "print" },
                       { t: "label", c: "name" },
                       { t: "label", c: "height" }]});
    });

    it("should parse an invocation on an arg that results from an invocation", function() {
      var ast = parse("print(get(shopping 1))");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "invocation",
                   c: [{ t: "label", c: "print" },
                       { t: "invocation",
                         c: [{ t: "label", c: "get" },
                             { t: "label", c: "shopping" },
                             { t: "number", c: 1 }]}]});
    });

    it("should parse an invoked lambda with param and body and arg", function() {
      var ast = parse("{ ?a add(a) }(1)");
      expect(util.stripAst(getNodeAt(ast, ["top", "do", 0])))
        .toEqual({ t: "invocation",
                   c: [{ t: "lambda",
                         c: [[{ t: "parameter", c: "a" }],
                             { t: "do",
                               c: [{ t: "invocation",
                                     c: [{ t: "label", c: "add" },
                                         { t: "label", c: "a" }]}]}]},
                       { t: "number", c: 1 }]});
    });

    it("should allow args on different lines", function() {
      var ast = parse("print(add(1) \n subtract(2))");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
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
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "invocation",
                   c: [{ t: "label", c: "print" },
                       { t: "number", c: 1 },
                       { t: "number", c: 2 }]});
    });

    it("should parse a double invocation", function() {
      var ast = parse("print()()");
      expect(util.stripAst(getNodeAt(ast, ["top", "do", 0])))
        .toEqual({ t: "invocation",
                   c: [{ t: "invocation",
                         c: [{ t: "label", c: "print" }]}]});
    });

    it("should parse a quadruple invocation w args", function() {
      var ast = parse("print(1)(2)(3)(4)");
      expect(util.stripAst(getNodeAt(ast, ["top", "do", 0])))
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
      expect(util.stripAst(getNodeAt(ast, ["top", "do", 0])))
        .toEqual({ t: "invocation",
                   c: [{ t: "invocation",
                         c: [{ t: "lambda",
                               c: [[], { t: "do",
                                         c: [{ t: "lambda",
                                               c: [[], { t: "do", c: []}]}]}]}]}]});
    });
  });

  describe("lambda", function() {
    it("should parse an uninvoked lambda with no params or body", function() {
      var ast = parse("{}");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "lambda", c: [[], { t: "do", c: []}]});
    });

    it("should parse an uninvoked lambda with two params and no body", function() {
      var ast = parse("{?name ?height}");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "lambda", c: [[{ t: "parameter", c: "name" },
                                     { t: "parameter", c: "height" }],
                                    { t: "do", c: []}]});
    });

    it("should parse an uninvoked lambda with two params and two body exprs", function() {
      var ast = parse("{?a ?b add(a b)\nsubtract(c d)}");
      expect(util.stripAst(getNodeAt(
        ast, ["top", "do", 0])))
        .toEqual({ t: "lambda", c: [[{ t: "parameter", c: "a" }, { t: "parameter", c: "b" }],
                                    { t: "do",
                                      c: [{ t: "invocation",
                                            c: [{ t: "label", c: "add" },
                                                { t: "label", c: "a" },
                                                { t: "label", c: "b" }]},
                                          { t: "invocation",
                                            c: [{ t: "label", c: "subtract" },
                                                { t: "label", c: "c" },
                                                { t: "label", c: "d" }]}]}]});

    });

    it("should allow newlines and spaces between every element of a lambda", function() {
      var ast = parse("{ \n ?a \n 1 \n 1 \n }");
      expect(util.stripAst(getNodeAt(ast, ["top", "do", 0])))
        .toEqual({ t: "lambda", c: [[{ t: "parameter", c: "a" }],
                                    { t: "do", c: [{t: "number", c:1}, {t: "number", c:1}]}]});

    });
  });

  describe("assignments", function() {
    it("should parse an assignment of a number", function() {
      var ast = parse("name: 1");
      expect(util.stripAst(getNodeAt(ast, ["top", "do", 0])))
        .toEqual({ t: "assignment", c: [{ t: "label", c: "name" },
                                        { t: "number", c: 1}]});
    });

    it("should parse an assignment of a lambda", function() {
      var ast = parse("name: { ?a a }");
      expect(util.stripAst(getNodeAt(ast, ["top", "do", 0])))
        .toEqual({ t: "assignment",
                   c: [{ t: "label", c: "name" },
                       { t: "lambda", c: [[{ t: "parameter", c: "a" }],
                                          { t: "do",
                                            c: [{ t: "label", c: "a" }] }]}]});
    });

    it("should parse an assignment of an invocation of a lambda", function() {
      var ast = parse("name: { ?a a }(1)");
      expect(util.stripAst(getNodeAt(ast, ["top", "do", 0])))
        .toEqual({ t: "assignment",
                   c: [{ t: "label", c: "name" },
                       { t: "invocation",
                         c: [{ t: "lambda",
                               c: [[{ t: "parameter", c: "a" }],
                                   { t: "do",
                                     c: [{ t: "label", c: "a" }]}]},
                             { t: "number", c: 1 }]}]});
    });

    it("should parse an assignment of an invocation of a label", function() {
      var ast = parse("name: add(1)");
      expect(util.stripAst(getNodeAt(ast, ["top", "do", 0])))
        .toEqual({ t: "assignment",
                   c: [{ t: "label", c: "name" },
                       { t: "invocation",
                         c: [{ t: "label", c: "add" },
                             { t: "number", c: 1 }]}]});
    });

    it("should allow space before expression after assignment", function() {
      var ast = parse('name: "Lauren"\n name');
      expect(util.stripAst(getNodeAt(ast, ["top", "do"])))
        .toEqual([{ t: "assignment", c: [{ t: "label", c: "name" },
                                         { t: "string", c: "Lauren"}]},
                  { t: "label", c: "name" }]);
    });
  });

  describe("conditional", function() {
    it("should parse an conditional with an if", function() {
      var ast = parse("if true { 1 }");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "conditional", c: [{ t: "boolean", c: true },
                                         { t: "lambda",
                                           c: [[], { t: "do", c: [{ t: "number", c: 1 }]}]}]});
    });

    it("should parse an conditional with if and else if", function() {
      var ast = parse("if true { 1 } elseif false { 2 }");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "conditional", c: [{ t: "boolean", c: true },
                                         { t: "lambda",
                                           c: [[], { t: "do", c: [{ t: "number", c: 1 }]}]},
                                         { t: "boolean", c: false },
                                         { t: "lambda",
                                           c: [[], { t: "do", c: [{ t: "number", c: 2 }]}]}]});
    });

    it("should parse an conditional with an if, else if and else", function() {
      var ast = parse("if true { 1 } elseif false { 2 } else { 3 }");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "conditional", c: [{ t: "boolean", c: true },
                                         { t: "lambda",
                                           c: [[], { t: "do", c: [{ t: "number", c: 1 }]}]},

                                         { t: "boolean", c: false },
                                         { t: "lambda",
                                           c: [[], { t: "do", c: [{ t: "number", c: 2 }]}]},

                                         { t: "boolean", c: true },
                                         { t: "lambda",
                                           c: [[], { t: "do", c: [{ t: "number", c: 3 }]}]}]});
    });

    it("should not allow else with condition", function() {
      expect(function() { parse("if true { 1 } else false { 2 }") }).toThrow();
    });

    it("should parse an conditional with if, two else ifs and else", function() {
      var ast = parse("if true { } elseif false { } elseif false { } else { }");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "conditional", c: [{ t: "boolean", c: true },
                                         { t: "lambda", c: [[], { t: "do", c: []}]},

                                         { t: "boolean", c: false },
                                         { t: "lambda", c: [[], { t: "do", c: []}]},

                                         { t: "boolean", c: false },
                                         { t: "lambda", c: [[], { t: "do", c: []}]},

                                         { t: "boolean", c: true },
                                         { t: "lambda", c: [[], { t: "do", c: []}]}]});
    });

    it("should parse an conditional with if w invoked conditional", function() {
      var ast = parse("if really(true) { }");
      expect(util.stripAst(getNodeAt(ast,
                                     ["top", "do", 0])))
        .toEqual({ t: "conditional", c: [{ t: "invocation",
                                           c: [{ t: "label", c: "really" },
                                               { t: "boolean", c: true }]},
                                         { t: "lambda", c: [[], { t: "do", c: []}]}]});
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
        parse.parseSyntax("a b");
      }).toThrow('Expected this to be on a new line');
    });

    it("should expect expression on same line nested in lambda to be preceded by nl", function() {
      expect(function() {
        parse.parseSyntax("{ { a b } }");
      }).toThrow('Expected this to be on a new line');
    });
  });
});
