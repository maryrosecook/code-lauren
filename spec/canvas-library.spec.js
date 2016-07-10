var _ = require("underscore");

var parse = require("../src/lang/parser");
var compile = require("../src/lang/compiler");
var vm = require("../src/lang/vm");
var standardLibrary = require("../src/lang/standard-library");
var canvasLibrary = require("../src/canvas-library");
var env = require("../src/env");

var canvasLib = canvasLibrary({});

function setupProgram(code) {
  return vm.initProgramState(code,
                             compile(parse(code)),
                             standardLibrary().merge(canvasLib.user));
};

describe("canvas library", function() {
  describe("draw", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('draw()')).get("exception").message)
        .toEqual("Needs a shape or some words to draw");
    });

    it("should report that an object without a type attribute is not a shape", function() {
      expect(vm.complete(setupProgram('draw(thing())')).get("exception").message)
        .toEqual("Should be a shape or some words to draw");
    });

    it("should report thing with non-rectangle/circle/text type attr is wrong type", function() {
      expect(vm.complete(setupProgram('th: thing()\nset(th "type" "blah")\ndraw(th)'))
             .get("exception").message)
        .toEqual("Should be a shape or some words to draw");
    });

    it("should draw rectangle", function() {
      expect(vm.complete(setupProgram('draw(rectangle(1 1 1 1))')).get("exception"))
        .toBeUndefined();
    });

    it("should draw circle", function() {
      expect(vm.complete(setupProgram('draw(circle(1 1 1))')).get("exception"))
        .toBeUndefined();
    });

    it("should draw text", function() {
      expect(vm.complete(setupProgram('draw(words(1 1 "hi"))')).get("exception"))
        .toBeUndefined();
    });
  });

  describe("rectangle", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('rectangle()')).get("exception").message)
        .toEqual("Needs the x coordinate of the center of the rectangle");

      expect(vm.complete(setupProgram('rectangle(10)')).get("exception").message)
        .toEqual("Needs the y coordinate of the center of the rectangle");

      expect(vm.complete(setupProgram('rectangle(10 10)')).get("exception").message)
        .toEqual("Needs the width");

      expect(vm.complete(setupProgram('rectangle(10 10 10)')).get("exception").message)
        .toEqual("Needs the height");
    });

    it("should make a rectangle", function() {
      var r = vm.complete(setupProgram('rectangle(1 2 3 4)')).get("stack").get(-1).v;
      expect(r.get("x")).toEqual(1);
      expect(r.get("y")).toEqual(2);
      expect(r.get("width")).toEqual(3);
      expect(r.get("height")).toEqual(4);
    });
  });

  describe("circle", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('circle()')).get("exception").message)
        .toEqual("Needs the x coordinate of the center of the circle");

      expect(vm.complete(setupProgram('circle(10)')).get("exception").message)
        .toEqual("Needs the y coordinate of the center of the circle");

      expect(vm.complete(setupProgram('circle(10 10)')).get("exception").message)
        .toEqual("Needs the width");
    });

    it("should make a circle", function() {
      var r = vm.complete(setupProgram('circle(1 2 3)')).get("stack").get(-1).v;
      expect(r.get("x")).toEqual(1);
      expect(r.get("y")).toEqual(2);
      expect(r.get("width")).toEqual(3);
    });
  });

  describe("words", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('words()')).get("exception").message)
        .toEqual("Needs the x coordinate of the center of the words");

      expect(vm.complete(setupProgram('words(10)')).get("exception").message)
        .toEqual("Needs the y coordinate of the center of the words");

      expect(vm.complete(setupProgram('words(10 10)')).get("exception").message)
        .toEqual("Needs some words or a number");
    });

    it("should make a words", function() {
      var r = vm.complete(setupProgram('words(1 2 "hi")')).get("stack").get(-1).v;
      expect(r.get("x")).toEqual(1);
      expect(r.get("y")).toEqual(2);
      expect(r.get("words")).toEqual("hi");
    });
  });

  describe("are-overlapping", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('are-overlapping()'))
             .get("exception").message)
        .toEqual("Needs a shape");

      expect(vm.complete(setupProgram('are-overlapping(rectangle(1 1 1 1))'))
             .get("exception").message)
        .toEqual("Needs another shape");
    });

    describe("rectangle rectangle", function() {
      it("should return true when two rectangles overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(rectangle(11 12 2 4) rectangle(14 15 4 2))')
        ).get("stack").get(-1).v).toEqual(true);
      });

      it("should return false when two rectangles not overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(rectangle(11 12 2 4) rectangle(15 15 4 2))')
        ).get("stack").get(-1).v).toEqual(false);
      });
    });

    describe("circle rectangle", function() {
      it("should return true when circle rectangle overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(circle(208 181 55) rectangle(153 216 70 43))')
        ).get("stack").get(-1).v).toEqual(true);
      });

      it("should return false when circle rectangle not overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(circle(223 180 55) rectangle(153 216 70 43))')
        ).get("stack").get(-1).v).toEqual(false);
      });
    });

    describe("rectangle circle", function() {
      it("should return true when rectangle circle overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(rectangle(153 216 70 43) circle(208 181 55))')
        ).get("stack").get(-1).v).toEqual(true);
      });

      it("should return false when rectangle circle not overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(rectangle(153 216 70 43) circle(223 180 55))')
        ).get("stack").get(-1).v).toEqual(false);
      });
    });

    describe("circle circle", function() {
      it("should return true when two circles overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(circle(332 180 55) circle(282 182 55))')
        ).get("stack").get(-1).v).toEqual(true);
      });

      it("should return false when two circles not overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(circle(345 180 55) circle(282 182 55))')
        ).get("stack").get(-1).v).toEqual(false);
      });
    });
  });

  describe("random-color", function() {
    it("should return a random color", function() {
      var color = vm.complete(setupProgram('random-color()')).get("stack").get(-1).v;
      expect(_.isString(color)).toEqual(true);
      expect(color.length > 3).toEqual(true);
    });
  });
});
