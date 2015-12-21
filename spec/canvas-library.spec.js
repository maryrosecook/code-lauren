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
        .toEqual("Needs a shape or a piece of text to draw");
    });

    it("should report that an object without a type attribute is not a shape", function() {
      expect(vm.complete(setupProgram('draw(make-thing())')).get("exception").message)
        .toEqual("Should be a shape or a piece of text to draw");
    });

    it("should report thing with non-rectangle/circle/text type attr is wrong type", function() {
      expect(vm.complete(setupProgram('th: make-thing()\nset(th "type" "blah")\ndraw(th)'))
             .get("exception").message)
        .toEqual("Should be a shape or a piece of text to draw");
    });

    it("should draw rectangle", function() {
      expect(vm.complete(setupProgram('draw(make-rectangle(1 1 1 1))')).get("exception"))
        .toBeUndefined();
    });

    it("should draw circle", function() {
      expect(vm.complete(setupProgram('draw(make-circle(1 1 1))')).get("exception"))
        .toBeUndefined();
    });

    it("should draw text", function() {
      expect(vm.complete(setupProgram('draw(make-text(1 1 "hi"))')).get("exception"))
        .toBeUndefined();
    });
  });

  describe("make-rectangle", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('make-rectangle()')).get("exception").message)
        .toEqual("Needs the x coordinate of the center of the rectangle");

      expect(vm.complete(setupProgram('make-rectangle(10)')).get("exception").message)
        .toEqual("Needs the y coordinate of the center of the rectangle");

      expect(vm.complete(setupProgram('make-rectangle(10 10)')).get("exception").message)
        .toEqual("Needs the width");

      expect(vm.complete(setupProgram('make-rectangle(10 10 10)')).get("exception").message)
        .toEqual("Needs the height");
    });

    it("should make a rectangle", function() {
      var r = vm.complete(setupProgram('make-rectangle(1 2 3 4)')).get("stack").get(-1).v;
      expect(r.get("x")).toEqual(1);
      expect(r.get("y")).toEqual(2);
      expect(r.get("width")).toEqual(3);
      expect(r.get("height")).toEqual(4);
    });
  });

  describe("make-circle", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('make-circle()')).get("exception").message)
        .toEqual("Needs the x coordinate of the center of the circle");

      expect(vm.complete(setupProgram('make-circle(10)')).get("exception").message)
        .toEqual("Needs the y coordinate of the center of the circle");

      expect(vm.complete(setupProgram('make-circle(10 10)')).get("exception").message)
        .toEqual("Needs the width");
    });

    it("should make a circle", function() {
      var r = vm.complete(setupProgram('make-circle(1 2 3)')).get("stack").get(-1).v;
      expect(r.get("x")).toEqual(1);
      expect(r.get("y")).toEqual(2);
      expect(r.get("width")).toEqual(3);
    });
  });

  describe("make-text", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('make-text()')).get("exception").message)
        .toEqual("Needs the x coordinate of the center of the text");

      expect(vm.complete(setupProgram('make-text(10)')).get("exception").message)
        .toEqual("Needs the y coordinate of the center of the text");

      expect(vm.complete(setupProgram('make-text(10 10)')).get("exception").message)
        .toEqual("Needs some words or a number");
    });

    it("should make a text", function() {
      var r = vm.complete(setupProgram('make-text(1 2 "hi")')).get("stack").get(-1).v;
      expect(r.get("x")).toEqual(1);
      expect(r.get("y")).toEqual(2);
      expect(r.get("text")).toEqual("hi");
    });
  });

  describe("are-overlapping", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('are-overlapping()'))
             .get("exception").message)
        .toEqual("Needs a shape");

      expect(vm.complete(setupProgram('are-overlapping(make-rectangle(1 1 1 1))'))
             .get("exception").message)
        .toEqual("Needs another shape");
    });

    describe("rectangle rectangle", function() {
      it("should return true when two rectangles overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(make-rectangle(11 12 2 4) make-rectangle(14 15 4 2))')
        ).get("stack").get(-1).v).toEqual(true);
      });

      it("should return false when two rectangles not overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(make-rectangle(11 12 2 4) make-rectangle(15 15 4 2))')
        ).get("stack").get(-1).v).toEqual(false);
      });
    });

    describe("circle rectangle", function() {
      it("should return true when circle rectangle overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(make-circle(208 181 55) make-rectangle(153 216 70 43))')
        ).get("stack").get(-1).v).toEqual(true);
      });

      it("should return false when circle rectangle not overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(make-circle(223 180 55) make-rectangle(153 216 70 43))')
        ).get("stack").get(-1).v).toEqual(false);
      });
    });

    describe("rectangle circle", function() {
      it("should return true when rectangle circle overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(make-rectangle(153 216 70 43) make-circle(208 181 55))')
        ).get("stack").get(-1).v).toEqual(true);
      });

      it("should return false when rectangle circle not overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(make-rectangle(153 216 70 43) make-circle(223 180 55))')
        ).get("stack").get(-1).v).toEqual(false);
      });
    });

    describe("circle circle", function() {
      it("should return true when two circles overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(make-circle(332 180 55) make-circle(282 182 55))')
        ).get("stack").get(-1).v).toEqual(true);
      });

      it("should return false when two circles not overlapping", function() {
        expect(vm.complete(
          setupProgram('are-overlapping(make-circle(345 180 55) make-circle(282 182 55))')
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
