var parse = require("../../src/lang/ben/interpreter.js").parse;
var _ = require("underscore");
var util = require("../util");

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
    it("should parse a number", function() {
      var ast = parse("1");
      expect(util.stripAst(getNodeAt(ast,
                                     ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "number", c: 1 });
    });

    it("should parse a string", function() {
      var ast = parse('"hello my name is mary"');
      expect(util.stripAst(getNodeAt(ast,
                                     ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "string", c: "hello my name is mary" });
    });

    it("should parse a label", function() {
      var ast = parse("person");
      expect(util.stripAst(getNodeAt(ast,
                                     ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "label", c: "person" });
    });
  });

  describe("top", function() {
    it("should allow an empty program", function() {
      var ast = parse("");
      expect(util.stripAst(getNodeAt(ast, ["invocation", 0, "lambda", 1, "expression_list"])))
        .toEqual([]);
    });

    it("should allow a list of top level expressions on separate lines", function() {
      var ast = parse("(print)\n\n(print)");
      expect(util.stripAst(getNodeAt(ast,
                                     ["invocation", 0, "lambda", 1, "expression_list"])))
        .toEqual([{ t: "invocation",
                    c: [{ t: "label", c: "print" }]},
                  { t: "invocation",
                    c: [{ t: "label", c: "print" }]}]);
    });
  });

  describe("invocation", function() {
    it("should parse an empty invocation", function() {
      var ast = parse("()");
      expect(util.stripAst(getNodeAt(ast,
                                     ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "invocation", c: []});
    });

    it("should parse an invocation with no args", function() {
      var ast = parse("(print)");
      expect(util.stripAst(getNodeAt(ast,
                                     ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "invocation", c: [{ t: "label", c: "print" }]});
    });

    it("should parse an invocation with two args", function() {
      var ast = parse("(print name)");
      expect(util.stripAst(getNodeAt(ast,
                                     ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "invocation", c: [{ t: "label", c: "print" },
                                        { t: "label", c: "name" }]});
    });

    it("should parse an invocation on an arg that results from an invocation", function() {
      var ast = parse("(print (get shopping 1))");
      expect(util.stripAst(getNodeAt(ast,
                                     ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "invocation",
                   c: [{ t: "label", c: "print" },
                       { t: "invocation",
                         c: [{ t: "label", c: "get" },
                             { t: "label", c: "shopping" },
                             { t: "number", c: 1 }]}]});
    });
  });

  describe("lambda", function() {
    it("should parse an uninvoked lambda with no params or body", function() {
      var ast = parse("{}");
      expect(util.stripAst(getNodeAt(ast,
                                     ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "lambda", c: [[], { t: "expression_list", c: []}]});
    });

    it("should parse an uninvoked lambda with two params and no body", function() {
      var ast = parse("{?name ?height}");
      expect(util.stripAst(getNodeAt(ast,
                                     ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "lambda", c: [[{ t: "parameter", c: "name" },
                                     { t: "parameter", c: "height" }],
                                    { t: "expression_list", c: []}]});
    });

    it("should parse an uninvoked lambda with two params and two body exprs", function() {
      var ast = parse("{?a ?b (add a b) (subtract a b)}");
      expect(util.stripAst(getNodeAt(
        ast, ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "lambda", c: [[{ t: "parameter", c: "a" },
                                     { t: "parameter", c: "b" }],
                                    { t: "expression_list",
                                      c: [{ t: "invocation",
                                            c: [{ t: "label", c: "add" },
                                                { t: "label", c: "a" },
                                                { t: "label", c: "b" }]},
                                          { t: "invocation",
                                            c: [{ t: "label", c: "subtract" },
                                                { t: "label", c: "a" },
                                                { t: "label", c: "b" }]}]}]});

    });

    it("should parse an invoked lambda with param and body and arg", function() {
      var ast = parse("({?a (add a 1)} 2)");
      expect(util.stripAst(getNodeAt(ast, ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "invocation",
                   c: [{ t: "lambda",
                         c: [[{ t: "parameter", c: "a" }],
                             { t: "expression_list",
                               c: [{ t: "invocation",
                                     c: [{ t: "label", c: "add" },
                                         { t: "label", c: "a" },
                                         { t: "number", c: 1 }]}]}]},
                       { t: "number", c: 2 }]});
    });
  });

  describe("let", function() {
    it("should parse a let with no bindings or body", function() {
      var ast = parse("(let [])");
      expect(util.stripAst(getNodeAt(ast, ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "let", c: [{ t: "bindings", c: [] }, { t: "expression_list", c: []}]});
    });

    it("should parse a let with no bindings and several body expressions", function() {
      var ast = parse("(let [] 1 2)");
      expect(util.stripAst(getNodeAt(ast, ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "let", c: [{ t: "bindings", c: [] },
                                 { t: "expression_list", c: [{ t: "number", c: 1 },
                                                             { t: "number", c: 2 }]}]});
    });

    it("should parse a let with several bindings and several body expressions", function() {
      var ast = parse("(let [a 1 b 2] 3 4)");
      expect(util.stripAst(getNodeAt(ast, ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "let", c: [{ t: "bindings", c: [{ t: "binding",
                                                        c: [{ t: "label", c: "a" },
                                                            { t: "number", c: 1 }]},
                                                      { t: "binding",
                                                        c: [{ t: "label", c: "b" },
                                                            { t: "number", c: 2 }]}]},
                                 { t: "expression_list", c: [{ t: "number", c: 3 },
                                                             { t: "number", c: 4 }]}]});
    });

    it("should parse a let with several parentheticals in the body", function() {
      var ast = parse("(let [] (add a) (subtract b))");
      expect(util.stripAst(getNodeAt(ast, ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "let", c: [{ t: "bindings", c: []},
                                 { t: "expression_list",
                                   c: [{ t: "invocation",
                                         c: [{ t: "label", c: "add" },
                                             { t: "label", c: "a" }]},
                                       { t: "invocation",
                                         c: [{ t: "label", c: "subtract" },
                                             { t: "label", c: "b" }]}]}]});
    });

    it("should parse a let var bound to a lambda", function() {
      var ast = parse("(let [a { ?b 2 }])");
      expect(util.stripAst(getNodeAt(ast, ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "let", c: [{ t: "bindings",
                                   c: [{ t: "binding",
                                         c: [{ t: "label", c: "a" },
                                             { t: "lambda",
                                               c: [[{ t: "parameter", c: "b" }],
                                                   { t: "expression_list",
                                                     c: [{ t: "number", c: 2 }]}]}]}]},
                                 { t: "expression_list", c: []}]});
    });

    it("should parse a let var bound to a lambda", function() {
      var ast = parse("(let [a (add b)])");
      expect(util.stripAst(getNodeAt(ast, ["invocation", 0, "lambda", 1, "expression_list", 0])))
        .toEqual({ t: "let", c: [{ t: "bindings",
                                   c: [{ t: "binding",
                                         c: [{ t: "label", c: "a" },
                                             { t: "invocation",
                                               c: [{ t: "label", c: "add" },
                                                   { t: "label", c: "b" }]}]}]},
                                 { t: "expression_list", c: []}]});
    });
  });
});
