var l = require("../src/lang/lis.js");

describe("parser", function() {
  it("should parse a var", function() {
    var ast = l.parse("height");
    expect(ast).toEqual({ t: "var", c: "height", l: 1, i: 1 });
  });

  it("should parse an integer", function() {
    var ast = l.parse("1");
    expect(ast).toEqual({ t: "num", c: 1, l: 1, i: 1 });
  });
});
