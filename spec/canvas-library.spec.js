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
  describe("write", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('write()')).get("exception").message)
        .toEqual("Needs something to write to the screen");

      expect(vm.complete(setupProgram('write("hi")')).get("exception").message)
        .toEqual("Needs the distance from the left of the screen");

      expect(vm.complete(setupProgram('write("hi" 100)')).get("exception").message)
        .toEqual("Needs the distance from the top of the screen");

      expect(vm.complete(setupProgram('write("hi" 100 100)')).get("exception").message)
        .toEqual("Needs the color of the text");
    });
  });

  describe("draw-oval", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('draw-oval()')).get("exception").message)
        .toEqual("Needs the distance of the center of the oval from the left of the screen");

      expect(vm.complete(setupProgram('draw-oval(10)')).get("exception").message)
        .toEqual("Needs the distance of the center of the oval from the top of the screen");

      expect(vm.complete(setupProgram('draw-oval(10 10)')).get("exception").message)
        .toEqual("Needs the width");

      expect(vm.complete(setupProgram('draw-oval(10 10 10)')).get("exception").message)
        .toEqual("Needs the height");

      expect(vm.complete(setupProgram('draw-oval(10 10 10 10)')).get("exception").message)
        .toEqual('Needs either "filled" or "unfilled"');

      expect(vm.complete(setupProgram('draw-oval(10 10 10 10 "filled")')).get("exception").message)
        .toEqual("Needs the color of the oval");
    });
  });

  describe("draw-rectangle", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('draw-rectangle()')).get("exception").message)
        .toEqual("Needs the distance of the center of the rectangle from the left of the screen");

      expect(vm.complete(setupProgram('draw-rectangle(10)')).get("exception").message)
        .toEqual("Needs the distance of the center of the rectangle from the top of the screen");

      expect(vm.complete(setupProgram('draw-rectangle(10 10)')).get("exception").message)
        .toEqual("Needs the width");

      expect(vm.complete(setupProgram('draw-rectangle(10 10 10)')).get("exception").message)
        .toEqual("Needs the height");

      expect(vm.complete(setupProgram('draw-rectangle(10 10 10 10)')).get("exception").message)
        .toEqual('Needs either "filled" or "unfilled"');

      expect(vm.complete(setupProgram('draw-rectangle(10 10 10 10 "filled")'))
             .get("exception").message)
        .toEqual("Needs the color of the rectangle");
    });
  });

  describe("rectangle-overlapping-rectangle", function() {
    it("should report missing args", function() {
      expect(vm.complete(setupProgram('rectangle-overlapping-rectangle()'))
             .get("exception").message)
        .toEqual("Needs the distance of the center of the first rectangle from left of the screen");

      expect(vm.complete(setupProgram('rectangle-overlapping-rectangle(1)'))
             .get("exception").message)
        .toEqual("Needs the distance of the center of the first rectangle from top of the screen");

      expect(vm.complete(setupProgram('rectangle-overlapping-rectangle(1 1)'))
             .get("exception").message)
        .toEqual("Needs the width of the first rectangle");

      expect(vm.complete(setupProgram('rectangle-overlapping-rectangle(1 1 1)'))
             .get("exception").message)
        .toEqual("Needs the height of the first rectangle");

      expect(vm.complete(setupProgram('rectangle-overlapping-rectangle(1 1 1 1)'))
             .get("exception").message)
        .toEqual("Needs the distance of the center of the second rectangle from left of the screen");

      expect(vm.complete(setupProgram('rectangle-overlapping-rectangle(1 1 1 1 1)'))
             .get("exception").message)
        .toEqual("Needs the distance of the center of the second rectangle from top of the screen");

      expect(vm.complete(setupProgram('rectangle-overlapping-rectangle(1 1 1 1 1 1)'))
             .get("exception").message)
        .toEqual("Needs the width of the second rectangle");

      expect(vm.complete(setupProgram('rectangle-overlapping-rectangle(1 1 1 1 1 1 1)'))
             .get("exception").message)
        .toEqual("Needs the height of the second rectangle");
    });

    it("should return true when two rectangles overlapping", function() {
      expect(vm.complete(setupProgram('rectangle-overlapping-rectangle(11 12 2 4 14 15 4 2)'))
             .get("stack").get(-1).v)
        .toEqual(true);
    });

    it("should return true when two rectangles not overlapping", function() {
      expect(vm.complete(setupProgram('rectangle-overlapping-rectangle(11 12 2 4 15 15 4 2)'))
             .get("stack").get(-1).v)
        .toEqual(false);
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
