var im = require("immutable");

var standardLibrary = require("../src/lang/standard-library.js");

var p = require("../src/lang/parser");
var c = require("../src/lang/compiler");
var v = require("../src/lang/vm");
var programState = require("../src/lang/program-state");
var langUtil = require("../src/lang/lang-util");
var heapLib = require("../src/lang/heap");
var envModule = require("../src/env");

function metaMock() {
  return { ast: { c: [{ c: undefined }]}};
};

function pointerToObject(ps, pointer) {
  return heapLib.get(ps.get("heap"), pointer).toObject();
};

describe("library", function() {
  describe("thing", function() {
    it("should be able to make new empty dict", function() {
      var code = 'thing()';
      var ps = v(code, c(p(code)));
      expect(pointerToObject(ps, ps.getIn(["stack", -1]).v)).toEqual({});
    });
  });

  describe("set", function() {
    it("should throw if missing args", function() {
      var code = 'set()';
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a thing to set some information on");

      var code = 'a: thing() \n set(a)';
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs the name of the information to set");

      var code = 'a: thing() \n set(a "key")';
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs the information to set");
    });

    it("should be able to add a value to a thing by mutating the thing", function() {
      var code = 'obj: thing() \n set(obj "key" "value") \n obj';
      var ps = v(code, c(p(code)));
      expect(pointerToObject(ps, ps.getIn(["stack", -1]).v)).toEqual({ key: "value" });
    });

    it("should be able to change a value on a thing by mutating the thing", function() {
      var code = 'obj: thing() \n set(obj "key" "a") \n set(obj "key" "b") \n obj';
      var ps = v(code, c(p(code)));
      expect(pointerToObject(ps, ps.getIn(["stack", -1]).v)).toEqual({ key: "b" });
    });

    it("should return newly updated thing", function() {
      var code = 'a: thing() \n set(a "key" "value")';
      expect(v(code, c(p(code))).getIn(["stack", -1]).v.toObject()).toEqual({ key: "value" });
    });

    it("should mutate var passed into lambda for outer scope var passed in from", function() {
      var code = 'a: thing() \n { ?a-prime set(a-prime "key" "value") }(a) \n a';
      var ps = v(code, c(p(code)));
      expect(ps.get("exception")).toBeUndefined();

      var thingPointer = ps.getIn(["stack", -1]).v;
      expect(pointerToObject(ps, thingPointer))
        .toEqual({ key: "value" });
    });
  });

  describe("get", function() {
    it("should throw if missing args", function() {
      var code = 'get()';
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a thing to get some information from");

      var code = 'a: thing() \n get(a)';
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs the name of the information to get");
    });

    it("should be able to get a value from a dict", function() {
      var code = 'a: thing() \n set(a "key" "value") \n get(a "key")';
      var ps = v(code, c(p(code)));
      expect(ps.getIn(["stack", -1]).v).toEqual("value");
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
        .toEqual("Needs a number or a piece of text");

      var code = "equal(1)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number or a piece of text to compare");
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
      var env = standardLibrary()
          .set("collect", langUtil.createBuiltinNormal(function(p, count) {
            counts.push(count);
            return { p: p, v: undefined }
          }));

      var ps = programState.init(code, c(p(code)), env);

      expect(v.complete(ps).get("exception").message)
        .toEqual("Never heard of blowup"); // catch blowup
      expect(counts).toEqual([false, true, false, true]);
    });

    it("should repeatedly return false false true when passed 3", function() {
      var code = "x: 0 \n forever { collect(counted(3)) \n if equal(5 x) { blowup } else { x: add(x 1) } }";

      var counts = [];
      var env = standardLibrary()
          .set("collect", langUtil.createBuiltinNormal(function(p, count) {
            counts.push(count);
            return { p: p, v: undefined }
          }));

      var ps = programState.init(code, c(p(code)), env);

      expect(v.complete(ps).get("exception").message)
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

  describe("opposite", function() {
    it("should be able to get opposite of a boolean", function() {
      var code = "opposite(true)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(false);

      var code = "opposite(false)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(true);
    });

    it("should be able to get opposite of a number", function() {
      var code = "opposite(1)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(-1);

      var code = "opposite(-1)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(1);
    });

    it("should throw if missing arg", function() {
      var code = "opposite()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number or true or false");
    });
  });

  describe("random-number", function() {
    it("should return 0 for 0, 0", function() {
      var code = "random-number(0 0)"
      var randomNumber = v(code, c(p(code))).getIn(["stack", -1]).v;
      expect(randomNumber).toEqual(0);
    });

    it("should return number between 0 and 400", function() {
      var code = "random-number(0 400)"
      var randomNumber = v(code, c(p(code))).getIn(["stack", -1]).v;
      expect(randomNumber >= 0).toEqual(true);
      expect(randomNumber <= 400).toEqual(true);
    });

    it("should throw if missing lowest num", function() {
      var code = "random-number()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a lowest possible random number");
    });

    it("should throw if missing highest num", function() {
      var code = "random-number(0)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a highest possible random number");
    });

    it("should throw if highest num arg is lower than lowest num arg", function() {
      var code = "random-number(10 8)";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Should be the highest possible random number.  Should be equal to or higher than 10, the lowest possible number you gave.");
    });

    it("should use 0 when passed", function() {
      // Regression.  Old chk.range() code did low = low ||
      // Number.MIN_SAFE_INTEGER which means 0, being falsy, got
      // replaced with min safe integer.

      var code = "random-number(0 0)"
      var randomNumber = v(code, c(p(code))).getIn(["stack", -1]).v;
      expect(randomNumber).toEqual(0);
    });
  });

  describe("square-root", function() {
    it("should be able to get square root of number", function() {
      var code = "square-root(4)"
      expect(v(code, c(p(code))).getIn(["stack", -1]).v).toEqual(2);
    });

    it("should throw if missing arg", function() {
      var code = "square-root()";
      expect(v(code, c(p(code))).get("exception").message)
        .toEqual("Needs a number to get the square root of");
    });
  });
});
