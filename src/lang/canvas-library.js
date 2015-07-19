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
      screen.fillStyle = "black";
    };

    addOperationToHistory(op);
    cachedDrawOperations.push(op);
  },

  "draw-circle": function(x, y, w, h, filledStr, color) {
    function op() {
      var kappa = 0.5522848;
      var ox = (w / 2) * kappa; // control point offset horizontal
      var oy = (h / 2) * kappa; // control point offset vertical
      var xe = x + w;           // x-end
      var ye = y + h;           // y-end
      var xm = x + w / 2;       // x-middle
      var ym = y + h / 2;       // y-middle

      screen.beginPath();
      screen.moveTo(x, ym);
      screen.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
      screen.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
      screen.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
      screen.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);

      if (filledStr === "unfilled") {
        screen.strokeStyle = color;
        screen.stroke();
        screen.strokeStyle = "black";
      } else if (filledStr === "filled") {
        screen.fillStyle = color;
        screen.fill();
        screen.fillStyle = "black";
      }
    };

    addOperationToHistory(op);
    cachedDrawOperations.push(op);
  },

  "draw-rectangle": function(x, y, width, height, filledStr, color) {
    function op() {
      if (filledStr === "unfilled") {
        screen.strokeStyle = color;
        screen.strokeRect(x, y, width, height);
        screen.strokeStyle = "black";
      } else if (filledStr === "filled") {
        screen.fillStyle = color;
        screen.fillRect(x, y, width, height);
        screen.fillStyle = "black";
      }
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
