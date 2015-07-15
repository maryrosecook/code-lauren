var _ = require("underscore");

var screen;
var step = 0;
var allDrawOperations = [];
var cachedDrawOperations = [];

function addOperationToHistory(fn) {
  allDrawOperations.push({ fn: fn, step: step });
  if (allDrawOperations.length > 5000) {
    allDrawOperations.shift();
  }
};

var programFns = {
  flush: function() {
    cachedDrawOperations.forEach(function(o) { o() })
    cachedDrawOperations = [];
  },

  stepForwards: function() {
    step++;
  },

  stepBackwards: function() {
    step--;
    programFns.redraw();
  },

  redraw: function() {
    var ops = [];
    for (var i = allDrawOperations.length - 1; i >= 0; i--) {
      if (allDrawOperations[i].step < step) {
        break;
      }

      ops.push(allDrawOperations[i]);
    }

    ops.forEach(function(o) { o.fn(); });
  },

  deleteOld: function(STEP_TO_SAVE) {
    var stopClearing = step - STEP_TO_SAVE;
    while (allDrawOperations[0] !== undefined && allDrawOperations[0].step < stopClearing) {
      allDrawOperations.shift();
    }
  },

  reset: function() {
    step = 0;
    allDrawOperations = [];
    cachedDrawOperations = [];
    screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
  }
};

var userFns = {
  "clear-screen": function() {
    function op() {
      screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
    };

    op();
    addOperationToHistory(op);

    programFns.flush();
  },

  "write-text": function(str, x, y, color) {
    function op() {
      screen.font = "20px Georgia";
      screen.fillStyle = color;
      screen.fillText(str, x, y);
    };

    addOperationToHistory(op);
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

    addOperationToHistory(op);
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

    addOperationToHistory(op);
    cachedDrawOperations.push(op);
  },

  "draw-unfilled-rectangle": function(x, y, width, height, color) {
    function op() {
      screen.strokeStyle = color;
      screen.strokeRect(x, y, width, height);
    };

    addOperationToHistory(op);
    cachedDrawOperations.push(op);
  },

  "draw-filled-rectangle": function(x, y, width, height, color) {
    function op() {
      screen.fillStyle = color;
      screen.fillRect(x, y, width, height);
    };

    addOperationToHistory(op);
    cachedDrawOperations.push(op);
  }
};

var api = {
  programFns: programFns,
  userFns: userFns
};

var setScreen = module.exports = function(inScreen) {
  if (screen !== undefined) { throw new Error("Already started"); }

  // run any unflushed cached ops - might get left if draw ops done,
  // program hasn't terminated and are outside a loop or loop has
  // ended
  setInterval(programFns.flush, 100);

  screen = inScreen;

  return api;
};
