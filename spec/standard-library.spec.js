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
      expect(function() { v(code, c(p(code))) }).toThrow("a number to add");

      var code = "add(1)";
      expect(function() { v(code, c(p(code))) }).toThrow("a number to add");
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

    it("should return false for no args", function() {
      expect(standardLibrary()["less-than"]()).toEqual(false);
    });
  });

  describe("greater-than", function() {
    it("should return true for 2 and 1", function() {
      expect(standardLibrary()["greater-than"]({}, 2, 1)).toEqual(true);
    });

    it("should return false for 1 and 2", function() {
      expect(standardLibrary()["greater-than"]({}, 1, 2)).toEqual(false);
    });

    it("should return false for no args", function() {
      expect(standardLibrary()["greater-than"]()).toEqual(false);
    });
  });

  describe("equal", function() {
    it("should return true for two identical args", function() {
      expect(standardLibrary()["equal"]({}, 1, 1)).toEqual(true);
    });
  });
});
