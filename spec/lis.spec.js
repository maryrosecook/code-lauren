var l = require("../src/lang/lis.js");

describe("hello world", function() {
  it("should parse a simple expression", function() {
    expect(l.parse("(1*2)")).toEqual(2);
  });
});
