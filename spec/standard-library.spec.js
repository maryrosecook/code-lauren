var standardLibrary = require("../src/lang/standard-library.js");

var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var v = require("../src/lang/vm");

describe("library", function() {
  describe("new-dictionary", function() {
    it("should be able to make new empty dict", function() {
      var lib = standardLibrary();
      expect(lib["new-dictionary"]()).toEqual({});
    });

    it("should be able to make new dict with initial keys and values", function() {
      var lib = standardLibrary();
      expect(lib["new-dictionary"]({}, "name", "mary", "height", 160))
        .toEqual({ name: "mary", height: 160 });
    });
  });

  describe("set", function() {
    it("should be able to set a value on a dict", function() {
      var lib = standardLibrary();
      expect(lib.set({}, lib["new-dictionary"](), "name", "mary").name).toEqual("mary");
    });
  });

  describe("get", function() {
    it("should be able to get a value from a dict", function() {
      var lib = standardLibrary();
      expect(lib.get({},
                     lib.set({},
                             lib["new-dictionary"](),
                             "name",
                             "mary"),
                     "name")).toEqual("mary");
    });
  });

  describe("add", function() {
    it("should be able to add two values", function() {
      expect(standardLibrary().add({}, 1, 2)).toEqual(3);
    });

    it("should throw if missing args", function() {
      var code = "add()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing two numbers");

      var code = "add(1)";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing a number to add");
    });
  });

  describe("subtract", function() {
    it("should be able to subtract two values", function() {
      expect(standardLibrary().subtract({}, 2, 1)).toEqual(1);
    });

    it("should throw if missing args", function() {
      var code = "subtract()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing two numbers");

      var code = "subtract(1)";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing a number to subtract");
    });
  });

  describe("multiply", function() {
    it("should be able to multiply two values", function() {
      expect(standardLibrary().multiply({}, 4, 2)).toEqual(8);
    });

    it("should throw if missing args", function() {
      var code = "multiply()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing two numbers to multiply");

      var code = "multiply(1)";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing a number to multiply by");
    });
  });

  describe("divide", function() {
    it("should be able to multiply two values", function() {
      expect(standardLibrary().divide({}, 8, 2)).toEqual(4);
    });

    it("should throw if missing args", function() {
      var code = "divide()";
      expect(function() { v(code, c(p(code))) })
        .toThrow("Missing a number to divide and a number to divide by");

      var code = "divide(1)";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing a number to divide by");
    });
  });

  describe("modulus", function() {
    it("should be able to modulo one value by another", function() {
      expect(standardLibrary().modulus({}, 8, 2)).toEqual(0);
    });

    it("should throw if missing args", function() {
      var code = "modulus()";
      expect(function() { v(code, c(p(code))) })
        .toThrow("Missing a number to divide and a number to divide by");

      var code = "modulus(1)";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing a number to divide by");
    });
  });

  describe("sine", function() {
    it("should be able to get sine of angle", function() {
      expect(standardLibrary().sine({}, 0)).toEqual(0);
    });

    it("should throw if missing args", function() {
      var code = "sine()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing an angle to get the sine of");
    });
  });

  describe("cosine", function() {
    it("should be able to get sine of angle", function() {
      expect(standardLibrary().cosine({}, 0)).toEqual(1);
    });

    it("should throw if missing args", function() {
      var code = "cosine()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing an angle to get the cosine of");
    });
  });

  describe("tangent", function() {
    it("should be able to get tangent of angle", function() {
      expect(standardLibrary().cosine({}, 0)).toEqual(1);
    });

    it("should throw if missing args", function() {
      var code = "tangent()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing an angle to get the tangent of");
    });
  });

  describe("radians", function() {
    it("should be able to get angle in radians", function() {
      expect(standardLibrary().radians({}, 360)).toEqual(6.282);
    });

    it("should throw if missing args", function() {
      var code = "radians()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing an angle to convert to radians");
    });
  });

  describe("degrees", function() {
    it("should be able to get angle in radians", function() {
      expect(standardLibrary().radians({}, 360)).toEqual(6.282);
    });

    it("should throw if missing args", function() {
      var code = "radians()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing an angle to convert to radians");
    });
  });

  describe("print", function() {
    it("should return printed output", function() {
      expect(standardLibrary().print({}, "a")).toEqual("a\n");
    });

    it("should throw if nothing passed to print", function() {
      var code = "print()";
      expect(function() { v(code, c(p(code))) }).toThrow("something to print");
    });
  });

  describe("less-than", function() {
    it("should return true for 1 and 2", function() {
      expect(standardLibrary()["less-than"]({}, 1, 2)).toEqual(true);
    });

    it("should return false for 2 and 1", function() {
      expect(standardLibrary()["less-than"]({}, 2, 1)).toEqual(false);
    });

    it("should throw if missing args", function() {
      var code = "less-than()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing two numbers");

      var code = "less-than(1)";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing a second number");
    });
  });

  describe("more-than", function() {
    it("should return true for 2 and 1", function() {
      expect(standardLibrary()["more-than"]({}, 2, 1)).toEqual(true);
    });

    it("should return false for 1 and 2", function() {
      expect(standardLibrary()["more-than"]({}, 1, 2)).toEqual(false);
    });

    it("should throw if missing args", function() {
      var code = "more-than()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing two numbers");

      var code = "more-than(1)";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing a second number");
    });
  });

  describe("equal", function() {
    it("should return true for two identical args", function() {
      expect(standardLibrary().equal({}, 1, 1)).toEqual(true);
    });

    it("should throw if missing args", function() {
      var code = "equal()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing two numbers");

      var code = "equal(1)";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing a second number");
    });
  });

  describe("counted", function() {
    it("should be able to count to three twice times", function() {
      var lib = standardLibrary();
      var meta = { ast: { s: 10 } };

      expect(lib.counted(meta, 3)).toEqual(false);
      expect(lib.counted(meta, 3)).toEqual(false);
      expect(lib.counted(meta, 3)).toEqual(true);

      expect(lib.counted(meta, 3)).toEqual(false);
      expect(lib.counted(meta, 3)).toEqual(false);
      expect(lib.counted(meta, 3)).toEqual(true);
    });

    it("should throw if missing args", function() {
      var code = "counted()";
      expect(function() { v(code, c(p(code))) }).toThrow("Missing a number to count to");
    });

    it("should throw if count number not greater than 0", function() {
      var code = "counted(0)";
      expect(function() { v(code, c(p(code))) })
        .toThrow("Number to count to must be more than 0");
    });
  });
});
