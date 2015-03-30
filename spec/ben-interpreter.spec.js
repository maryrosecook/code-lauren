var run = require("../src/lang/ben.js");

function pp(str) {
  console.log(JSON.stringify(str, null, 2));
}

describe("interpreter", function() {
  describe("env", function() {
    it("should be able to interpret if no env passed in", function() {
      expect(run("1")).toEqual(1);
    });
  });

  describe("literals", function() {
    it("should be able to produce a number", function() {
      expect(run("1")).toEqual(1);
    });

    it("should be able to produce a string", function() {
      expect(run('"my name is ben"')).toEqual("my name is ben");
    });
  });

  describe("labels", function() {


  });

  describe("do blocks", function() {
    it("should return last expression in a do block", function() {
      expect(run("1\n2\n3")).toEqual(3);
    });
  });
});
