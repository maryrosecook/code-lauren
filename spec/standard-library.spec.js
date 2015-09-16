var standardLibrary = require("../src/lang/standard-library.js");

var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var v = require("../src/lang/vm");
var envModule = require("../src/env");

function metaMock() {
  return { ast: { c: [{ c: undefined }]}};
};

describe("library", function() {
  describe("new-dictionary", function() {
    it("should be able to make new empty dict", function() {
      var lib = standardLibrary();
      expect(lib.get("new-dictionary")()).toEqual({});
    });

    it("should be able to make new dict with initial keys and values", function() {
      var lib = standardLibrary();
      expect(lib.get("new-dictionary")({}, "name", "mary", "height", 160))
        .toEqual({ name: "mary", height: 160 });
    });
  });

  describe("set", function() {
    it("should be able to set a value on a dict", function() {
      var lib = standardLibrary();
      expect(lib.get("set")({}, lib.get("new-dictionary")(), "name", "mary").name).toEqual("mary");
    });
  });

  describe("get", function() {
    it("should be able to get a value from a dict", function() {
      var lib = standardLibrary();
      expect(lib.get("get")({},
                            lib.get("set")({},
                                           lib.get("new-dictionary")(),
                                           "name",
                                           "mary"),
                            "name")).toEqual("mary");
    });
  });

  describe("add", function() {
    it("should be able to add two values", function() {
      var code = "add(1 2)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(3);
    });

    it("should throw if missing args", function() {
      var code = "add()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to add to");

      var code = "add(1)";
      expect(v(code, c(p(code))).get("exception").message).toEqual("Needs a number to add");
    });
  });

  describe("subtract", function() {
    it("should be able to subtract two values", function() {
      var code = "subtract(2 1)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(1);
    });

    it("should throw if missing args", function() {
      var code = "subtract()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to subtract from");

      var code = "subtract(1)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to subtract");
    });
  });

  describe("multiply", function() {
    it("should be able to multiply two values", function() {
      var code = "multiply(4 2)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(8);
    });

    it("should throw if missing args", function() {
      var code = "multiply()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to multiply");

      var code = "multiply(1)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to multiply by");
    });
  });

  describe("divide", function() {
    it("should be able to multiply two values", function() {
      var code = "divide(8 2)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(4);
    });

    it("should throw if missing args", function() {
      var code = "divide()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to divide");

      var code = "divide(1)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to divide by");
    });
  });

  describe("modulus", function() {
    it("should be able to modulo one value by another", function() {
      var code = "modulus(8 2)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(0);
    });

    it("should throw if missing args", function() {
      var code = "modulus()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to divide");

      var code = "modulus(1)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to divide by");
    });
  });

  describe("sine", function() {
    it("should be able to get sine of angle", function() {
      var code = "sine(0)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(0);
    });

    it("should throw if missing args", function() {
      var code = "sine()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs an angle to get the sine of");
    });
  });

  describe("cosine", function() {
    it("should be able to get sine of angle", function() {
      var code = "cosine(0)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(1);
    });

    it("should throw if missing args", function() {
      var code = "cosine()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs an angle to get the cosine of");
    });
  });

  describe("tangent", function() {
    it("should be able to get tangent of angle", function() {
      var code = "tangent(0)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(0);
    });

    it("should throw if missing args", function() {
      var code = "tangent()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs an angle to get the tangent of");
    });
  });

  describe("radians", function() {
    it("should be able to get angle in radians", function() {
      var code = "radians(360)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(6.282);
    });

    it("should throw if missing args", function() {
      var code = "radians()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs an angle to convert to radians");
    });
  });

  describe("degrees", function() {
    it("should be able to get angle in radians", function() {
      var code = "degrees(6.282)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(360);
    });

    it("should throw if missing args", function() {
      var code = "radians()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs an angle to convert to radians");
    });
  });

  describe("print", function() {
    it("should return printed output", function() {
      var code = 'print("a")'
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual("a\n");
    });

    it("should throw if nothing passed to print", function() {
      var code = "print()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs something to print");
    });
  });

  describe("less-than", function() {
    it("should return true for 1 and 2", function() {
      var code = "less-than(1 2)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(true);
    });

    it("should return false for 2 and 1", function() {
      var code = "less-than(2 1)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(false);
    });

    it("should throw if missing args", function() {
      var code = "less-than()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number");

      var code = "less-than(1)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to compare");
    });
  });

  describe("more-than", function() {
    it("should return true for 2 and 1", function() {
      var code = "more-than(2 1)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(true);
    });

    it("should return false for 1 and 2", function() {
      var code = "more-than(1 2)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(false);
    });

    it("should throw if missing args", function() {
      var code = "more-than()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number");

      var code = "more-than(1)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to compare");
    });
  });

  describe("equal", function() {
    it("should return true for two identical args", function() {
      var code = "equal(1 1)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(true);
    });

    it("should throw if missing args", function() {
      var code = "equal()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number");

      var code = "equal(1)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to compare");
    });
  });

  describe("counted", function() {
    it("should always return true when passed 1", function() {
      var code = "counted(1)";
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(true);
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(true);
    });

    it("should repeatedly return false true when passed 2", function() {
      var code = "x: 0 \n forever { collect(counted(2)) \n if equal(3 x) { blowup } else { x: add(x 1) } }";

      var counts = [];
      var env = standardLibrary().set("collect", function(__, count) { counts.push(count); });

      expect(v(code, c(p(code)), env).get("exception").message)
        .toEqual("Never heard of blowup"); // catch blowup
      expect(counts).toEqual([false, true, false, true]);
    });

    it("should repeatedly return false false true when passed 3", function() {
      var code = "x: 0 \n forever { collect(counted(3)) \n if equal(5 x) { blowup } else { x: add(x 1) } }";

      var counts = [];
      var env = standardLibrary().set("collect", function(__, count) { counts.push(count); });

      expect(v(code, c(p(code)), env).get("exception").message)
        .toEqual("Never heard of blowup"); // catch blowup
      expect(counts).toEqual([false, false, true, false, false, true]);
    });

    it("should throw if missing args", function() {
      var code = "counted()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to count to that is more than 0");
    });

    it("should throw if count number not greater than 0", function() {
      var code = "counted(0)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Should be a number to count that is more than 0");
    });
  });
});
