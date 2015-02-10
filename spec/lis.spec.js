var l = require("../src/lang/lis.js");

function strip(obj) {
  if (typeof obj === "object") {
    delete obj.l;
    delete obj.i;
    Object.keys(obj).forEach(function(k) { strip(obj[k]) });
  }

  return obj
};

describe("parser", function() {
  it("should parse a var", function() {
    var ast = l.parse("height");
    expect(strip(ast)).toEqual({ t: "ident", c: "height" });
  });

  it("should parse an integer", function() {
    var ast = l.parse("1");
    expect(strip(ast)).toEqual({ t: "num", c: 1 });
  });

  it("should parse a variable assignmest", function() {
    var ast = l.parse("height:\n  160");
    expect(strip(ast)).toEqual({
      t: "assignment", c: [
        { t: "ident", c: "height" },
        { t: "num", c: 160 }
      ]
    });
  });
});
