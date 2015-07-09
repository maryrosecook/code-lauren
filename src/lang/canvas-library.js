var _ = require("underscore");

var canvasLibrary = module.exports = function(screen) {
  var step = 0;
  var allDrawOperations = [];
  var cachedDrawOperations = [];

  function runCachedOperations() {
    cachedDrawOperations.forEach(function(o) { o() })
    cachedDrawOperations = [];
  };

  function rerunOperationsToCurrentStep() {
    var ops = [];
    for (var i = allDrawOperations.length - 1; i >= 0; i--) {
      if (allDrawOperations[i].step < step) {
        break;
      }

      ops.push(allDrawOperations[i]);
    }

    ops.forEach(function(o) { o.fn(); });
  };

  // run any unflushed cached ops - might get left if draw ops done,
  // program hasn't terminated and are outside a loop or loop has
  // ended
  setInterval(runCachedOperations, 100);

  return {
    flush: function() {
      runCachedOperations();
    },

    stepForwards: function() {
      step++;
    },

    stepBackwards: function() {
      step--;
      rerunOperationsToCurrentStep();
    },

    "clear-screen": function() {
      function op() {
        screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
      };

      op();
      allDrawOperations.push({ fn: op, step: step });

      runCachedOperations();
    },

    "write-text": function(str, x, y, color) {
      function op() {
        screen.font = "20px Georgia";
        screen.fillStyle = color;
        screen.fillText(str, x, y);
      };

      allDrawOperations.push({ fn: op, step: step });
      cachedDrawOperations.push(op);
    },

    "draw-unfilled-circle": function(x, y, radius, color) {
      function op() {
        screen.beginPath();
        screen.arc(x, y, radius, 0, Math.PI * 2, true);
        screen.closePath();
        screen.strokeStyle = color;
        screen.stroke();
      };

      allDrawOperations.push({ fn: op, step: step });
      cachedDrawOperations.push(op);
    },

    "draw-filled-circle": function(x, y, radius, color) {
      function op() {
        screen.beginPath();
        screen.arc(x, y, radius, 0, Math.PI * 2, true);
        screen.closePath();
        screen.fillStyle = color;
        screen.fill();
      };

      allDrawOperations.push({ fn: op, step: step });
      cachedDrawOperations.push(op);
    },

    "draw-unfilled-rectangle": function(x, y, width, height, color) {
      function op() {
        screen.strokeStyle = color;
        screen.strokeRect(x, y, width, height);
      };

      allDrawOperations.push({ fn: op, step: step });
      cachedDrawOperations.push(op);
    },

    "draw-filled-rectangle": function(x, y, width, height, color) {
      function op() {
        screen.fillStyle = color;
        screen.fillRect(x, y, width, height);
      };

      allDrawOperations.push({ fn: op, step: step });
      cachedDrawOperations.push(op);
    }
  };
};
