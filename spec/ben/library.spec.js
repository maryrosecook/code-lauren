var lib = require("../../src/lang/ben/standard-library.js");

function pp(str) {
  console.log(JSON.stringify(str, null, 2));
}

describe("library", function() {
  describe("new-dictionary", function() {
    it("should be able to make new empty dict", function() {
      expect(lib["new-dictionary"]()).toEqual({});
    });

    it("should be able to make new dict with initial keys and values", function() {
      expect(lib["new-dictionary"]("name", "mary", "height", 160))
        .toEqual({ name: "mary", height: 160 });
    });
  });

  describe("set", function() {
    it("should be able to set a value on a dict", function() {
      expect(lib.set(lib["new-dictionary"](), "name", "mary").name).toEqual("mary");
    });
  });

  describe("get", function() {
    it("should be able to get a value from a dict", function() {
      expect(lib.get(lib.set(lib["new-dictionary"](),
                             "name",
                             "mary"),
                     "name")).toEqual("mary");
    });
  });
});
