var _ = require("underscore");

var canvasLibrary = module.exports = function(screen) {
  var drawOperations = [];

  function runCachedOperations() {
    drawOperations.forEach(function(o) { o() })
    drawOperations = [];
  };

  // run any unflushed cached ops - might get left if draw ops done,
  // program hasn't terminated and are outside a loop or loop has
  // ended
  setInterval(runCachedOperations, 100);

  return {
    flush: function() {
      runCachedOperations();
    },

    "clear-screen": function() {
      screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
      runCachedOperations();
    },

    "write-text": function(str, x, y, color) {
      drawOperations.push(function() {
        screen.font = "20px Georgia";
        screen.fillStyle = color;
        screen.fillText(str, x, y);
      });
    },

    "draw-unfilled-circle": function(x, y, radius, color) {
      drawOperations.push(function() {
        screen.beginPath();
        screen.arc(x, y, radius, 0, Math.PI * 2, true);
        screen.closePath();
        screen.strokeStyle = color;
        screen.stroke();
      });
    },

    "draw-filled-circle": function(x, y, radius, color) {
      drawOperations.push(function() {
        screen.beginPath();
        screen.arc(x, y, radius, 0, Math.PI * 2, true);
        screen.closePath();
        screen.fillStyle = color;
        screen.fill();
      });
    },

    "draw-unfilled-rectangle": function(x, y, width, height, color) {
      drawOperations.push(function() {
        screen.strokeStyle = color;
        screen.strokeRect(x, y, width, height);
      });
    },

    "draw-filled-rectangle": function(x, y, width, height, color) {
      drawOperations.push(function() {
        screen.fillStyle = color;
        screen.fillRect(x, y, width, height);
      });
    }
  };
};
