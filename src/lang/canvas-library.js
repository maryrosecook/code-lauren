var _ = require("underscore");

var canvasLibrary = module.exports = function(screen) {
  var drawOperations = [];

  function* runCachedOperations() {
    for (var i = 0; i < drawOperations.length; i++) {
      yield* drawOperations[i]();
    }

    drawOperations = [];
  };

  return {
    "write-text": function*(str, x, y, color) {
      yield* runCachedOperations();
      screen.font = "20px Georgia";
      screen.fillStyle = color;
      screen.fillText(str, x, y);
    },

    "clear-screen": function*() {
      drawOperations.push(function*() {
        screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
      });
    },

    "draw-unfilled-circle": function*(x, y, radius, color) {
      yield* runCachedOperations();
      screen.beginPath();
      screen.arc(x, y, radius, 0, Math.PI * 2, true);
      screen.closePath();
      screen.strokeStyle = color;
      screen.stroke();
    },

    "draw-filled-circle": function*(x, y, radius, color) {
      yield* runCachedOperations();
      screen.beginPath();
      screen.arc(x, y, radius, 0, Math.PI * 2, true);
      screen.closePath();
      screen.fillStyle = color;
      screen.fill();
    },

    "draw-unfilled-rectangle": function*(x, y, width, height, color) {
      yield* runCachedOperations();
      screen.strokeStyle = color;
      screen.strokeRect(x, y, width, height);
    },

    "draw-filled-rectangle": function*(x, y, width, height, color) {
      yield* runCachedOperations();
      screen.fillStyle = color;
      screen.fillRect(x, y, width, height);
    }
  };
};
