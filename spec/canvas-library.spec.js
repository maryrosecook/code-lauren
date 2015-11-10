var parse = require("../src/lang/parser");
var compile = require("../src/lang/compiler");
var vm = require("../src/lang/vm");
var standardLibrary = require("../src/lang/standard-library");
var canvasLibrary = require("../src/canvas-library");
var env = require("../src/env");

var canvasLib = canvasLibrary({});
canvasLib.program.shutDown();

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
        .toEqual("Needs the distance from the left of the screen");

      expect(vm.complete(setupProgram('draw-oval(10)')).get("exception").message)
        .toEqual("Needs the distance from the top of the screen");

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
        .toEqual("Needs the distance from the left of the screen");

      expect(vm.complete(setupProgram('draw-rectangle(10)')).get("exception").message)
        .toEqual("Needs the distance from the top of the screen");

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
});
