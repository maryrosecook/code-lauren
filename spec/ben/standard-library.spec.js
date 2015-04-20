var standardLibrary = require("../../src/lang/ben/standard-library.js");
var util = require("../util");
var c = util.complete;

describe("library", function() {
  describe("new-dictionary", function() {
    it("should be able to make new empty dict", function() {
      var lib = standardLibrary();
      expect(c(lib["new-dictionary"]())).toEqual({});
    });

    it("should be able to make new dict with initial keys and values", function() {
      var lib = standardLibrary();
      expect(c(lib["new-dictionary"]("name", "mary", "height", 160)))
        .toEqual({ name: "mary", height: 160 });
    });
  });

  describe("set", function() {
    it("should be able to set a value on a dict", function() {
      var lib = standardLibrary();
      expect(c(lib.set(lib["new-dictionary"](), "name", "mary")).name).toEqual("mary");
    });
  });

  describe("get", function() {
    it("should be able to get a value from a dict", function() {
      var lib = standardLibrary();
      expect(c(lib.get(c(lib.set(c(lib["new-dictionary"]()),
                                 "name",
                                 "mary")),
                       "name"))).toEqual("mary");
    });
  });

  describe("add", function() {
    it("should be able to add many values", function() {
      expect(c(standardLibrary().add(1, 2, 3, 4))).toEqual(10);
    });

    it("should be able to add one value", function() {
      expect(c(standardLibrary().add(1))).toEqual(1);
    });

    it("should return undefined if nothing passed", function() {
      expect(c(standardLibrary().add())).toBeUndefined();
    });
  });

  describe("print", function() {
    it("should return printed output", function() {
      expect(c(standardLibrary().print("a"))).toEqual("a\n");
    });

    it("should print newline if nothing passed", function() {
      expect(c(standardLibrary().print())).toEqual("\n");
    });

    it("should concat items with spaces if many passed", function() {
      expect(c(standardLibrary().print("a", "b", "c"))).toEqual("a b c\n");
    });
  });

  describe("less-than", function() {
    it("should return true for 1 and 2", function() {
      expect(c(standardLibrary()["less-than"](1, 2))).toEqual(true);
    });

    it("should return false for 2 and 1", function() {
      expect(c(standardLibrary()["less-than"](2, 1))).toEqual(false);
    });

    it("should return false for no args", function() {
      expect(c(standardLibrary()["less-than"]())).toEqual(false);
    });
  });

  describe("greater-than", function() {
    it("should return true for 2 and 1", function() {
      expect(c(standardLibrary()["greater-than"](2, 1))).toEqual(true);
    });

    it("should return false for 1 and 2", function() {
      expect(c(standardLibrary()["greater-than"](1, 2))).toEqual(false);
    });

    it("should return false for no args", function() {
      expect(c(standardLibrary()["greater-than"]())).toEqual(false);
    });
  });

  describe("equals", function() {
    it("should return false for no args", function() {
      expect(c(standardLibrary()["equals"]())).toEqual(false);
    });

    it("should return true for two identical args", function() {
      expect(c(standardLibrary()["equals"](1, 1))).toEqual(true);
    });

    it("should return true for four identical args", function() {
      expect(c(standardLibrary()["equals"](1, 1, 1, 1))).toEqual(true);
    });

    it("should return false for four args with one different at the beginning", function() {
      expect(c(standardLibrary()["equals"](2, 1, 1, 1))).toEqual(false);
    });

    it("should return false for four args with one different at the end", function() {
      expect(c(standardLibrary()["equals"](1, 1, 1, 2))).toEqual(false);
    });
  });
});
