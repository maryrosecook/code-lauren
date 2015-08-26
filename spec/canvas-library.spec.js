var parse = require("../src/lang/parser");
var compile = require("../src/lang/compiler");
var vm = require("../src/lang/vm");
var standardLibrary = require("../src/lang/standard-library");
var canvasLibrary = require("../src/lang/canvas-library");
var env = require("../src/env");

var canvasLib = canvasLibrary({});
canvasLib.programFns.shutDown();

function setupProgram(code) {
  var programEnv = env.createEnv(env.mergeLibraries(standardLibrary(),
                                                    canvasLib.userFns));
  return vm.initProgramState(code, compile(parse(code)), programEnv);
};

describe("canvas library", function() {
  describe("write", function() {
    it("should report missing args", function() {
      expect(function() { vm.complete(setupProgram('write()')) })
        .toThrow("Missing something to write to the screen");

      expect(function() { vm.complete(setupProgram('write("hi")')) })
        .toThrow("Missing the distance from the left of the screen");

      expect(function() { vm.complete(setupProgram('write("hi" 100)')) })
        .toThrow("Missing the distance from the top of the screen");

      expect(function() { vm.complete(setupProgram('write("hi" 100 100)')) })
        .toThrow("Missing the color of the text");
    });
  });

  describe("draw-oval", function() {
    it("should report missing args", function() {
      expect(function() { vm.complete(setupProgram('draw-oval()')) })
        .toThrow("Missing the distance from the left of the screen");

      expect(function() { vm.complete(setupProgram('draw-oval(10)')) })
        .toThrow("Missing the distance from the top of the screen");

      expect(function() { vm.complete(setupProgram('draw-oval(10 10)')) })
        .toThrow("Missing a width");

      expect(function() { vm.complete(setupProgram('draw-oval(10 10 10)')) })
        .toThrow("Missing a height");

      expect(function() { vm.complete(setupProgram('draw-oval(10 10 10 10)')) })
        .toThrow('Missing either "filled" or "unfilled"');

      expect(function() { vm.complete(setupProgram('draw-oval(10 10 10 10 "filled")')) })
        .toThrow("Missing the color of the text");
    });
  });

  describe("draw-rectangle", function() {
    it("should report missing args", function() {
      expect(function() { vm.complete(setupProgram('draw-rectangle()')) })
        .toThrow("Missing the distance from the left of the screen");

      expect(function() { vm.complete(setupProgram('draw-rectangle(10)')) })
        .toThrow("Missing the distance from the top of the screen");

      expect(function() { vm.complete(setupProgram('draw-rectangle(10 10)')) })
        .toThrow("Missing a width");

      expect(function() { vm.complete(setupProgram('draw-rectangle(10 10 10)')) })
        .toThrow("Missing a height");

      expect(function() { vm.complete(setupProgram('draw-rectangle(10 10 10 10)')) })
        .toThrow('Missing either "filled" or "unfilled"');

      expect(function() { vm.complete(setupProgram('draw-rectangle(10 10 10 10 "filled")')) })
        .toThrow("Missing the color of the text");
    });
  });
});
