var l = require("../src/lang/ben.js");

function strip(obj) {
  if (typeof obj === "object") {
    delete obj.l;
    delete obj.i;
    Object.keys(obj).forEach(function(k) { strip(obj[k]) });
  }

  return obj
};

describe("parser", function() {
  describe("atoms", function() {
    it("should parse a number", function() {
      var ast = l.parse("1");
      expect(strip(ast)).toEqual({ t: "number", c: 1 });
    });

    it("should parse a string", function() {
      var ast = l.parse('"hello my name is mary"');
      expect(strip(ast)).toEqual({ t: "string", c: "hello my name is mary" });
    });

    it("should parse a label", function() {
      var ast = l.parse("person");
      expect(strip(ast)).toEqual({ t: "label", c: "person" });
    });
  });

  describe("lists", function() {
    it("should parse an empty list", function() {
      var ast = l.parse("[]");
      expect(strip(ast)).toEqual({ t: "list", c: [] });
    });

    it("should parse a list with two items", function() {
      var ast = l.parse("[1 2]");
      expect(strip(ast)).toEqual({ t: "list", c: [{ t: "number", c: 1 },
                                                  { t: "number", c: 2 }] });
    });

    it("should parse a with a nested list", function() {
      var ast = l.parse("[1 [2 3]]");
      expect(strip(ast)).toEqual({ t: "list", c: [{ t: "number", c: 1 },
                                                  { t: "list", c: [{ t: "number", c: 2 },
                                                                   { t: "number", c: 3 }]}]});
    });
  });

  describe("invocation", function() {
    it("should parse an empty invocation", function() {
      var ast = l.parse("()");
      expect(strip(ast)).toEqual({ t: "invocation", c: [] });
    });

    it("should parse an invocation with no args", function() {
      var ast = l.parse("(print)");
      expect(strip(ast)).toEqual({ t: "invocation", c: [{ t: "label", c: "print" }]});
    });

    it("should parse an invocation with two args", function() {
      var ast = l.parse("(print name)");
      expect(strip(ast)).toEqual({ t: "invocation", c: [{ t: "label", c: "print" },
                                                        { t: "label", c: "name" }]});
    });

    it("should parse an invocation on an arg that results from an invocation", function() {
      var ast = l.parse("(print (get shopping 1))");
      expect(strip(ast)).toEqual({ t: "invocation",
                                   c: [{ t: "label", c: "print" },
                                       { t: "invocation", c: [{ t: "label", c: "get" },
                                                              { t: "label", c: "shopping" },
                                                              { t: "number", c: 1 }]}]});
    });
  });

  describe("lambda", function() {
    it("should parse an uninvoked lambda with no params or body", function() {
      var ast = l.parse("{}");
      expect(strip(ast)).toEqual({ t: "lambda", c: { parameters: [], body: [] } });
    });

    it("should parse an uninvoked lambda with two params and no body", function() {
      var ast = l.parse("{?name ?height}");
      expect(strip(ast)).toEqual({ t: "lambda",
                                   c: { parameters: [{ t: "parameter", c: "name" },
                                                     { t: "parameter", c: "height" }],
                                        body: [] }});
    });


  });
});
