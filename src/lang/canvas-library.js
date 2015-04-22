var _ = require("underscore");

var canvasLibrary = module.exports = function(screen) {
  return {
    "write-text": function*(str, x, y, color) {
      screen.font = "20px Georgia";
      screen.fillStyle = color;
      screen.fillText(str, x, y);
    },

    "clear-screen": function*() {
      screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
    },

    "draw-unfilled-circle": function*(x, y, radius, color) {
      screen.beginPath();
      screen.arc(x, y, radius, 0, Math.PI * 2, true);
      screen.closePath();
      screen.strokeStyle = color;
      screen.stroke();
    },

    "draw-filled-circle": function*(x, y, radius, color) {
      screen.beginPath();
      screen.arc(x, y, radius, 0, Math.PI * 2, true);
      screen.closePath();
      screen.fillStyle = color;
      screen.fill();
    },

    "draw-unfilled-rectangle": function*(x, y, width, height, color) {
      screen.strokeStyle = color;
      screen.strokeRect(x, y, width, height);
    },

    "draw-filled-rectangle": function*(x, y, width, height, color) {
      screen.fillStyle = color;
      screen.fillRect(x, y, width, height);
    },

    sine: function*(x) {
      return Math.sin(x);
    },

    cosine: function*(x) {
      return Math.cos(x);
    },

    radians: function*(x) {
      return 0.01745 * x;
    }
  };
};
