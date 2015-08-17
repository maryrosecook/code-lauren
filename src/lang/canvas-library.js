var _ = require("underscore");
var langUtil = require("./lang-util");

var screen;
var step = 0;
var allDrawOperations = [];
var cachedDrawOperations = [];
var flushIntervalId;

function addOperation(fn, name, isClearScreen) {
  var op = {
    fn: fn,
    step: step,
    name: name,
    isClearScreen: isClearScreen === true ? true : false
  };

  allDrawOperations.push(op);
  cachedDrawOperations.push(op);

  if (allDrawOperations.length > 5000) {
    allDrawOperations.shift();
  }

  if (cachedDrawOperations.length > 5000) {
    throw new Error("Cached draw ops exceeded save state limit.");
  }
};

var programFns = {
  flush: function() {
    cachedDrawOperations
      .filter(function(o) { return o.isClearScreen === false;  })
      .forEach(function(o) { o.fn(); });
    cachedDrawOperations = [];
  },

  stepForwards: function() {
    step++;
  },

  stepBackwards: function() {
    step--;
    programFns.redraw();
  },

  pause: function() {
    programFns.redraw();
  },

  hitClearScreen: function() {
    return _.find(cachedDrawOperations,
                  function(o) { return o.isClearScreen === true; }) !== undefined;
  },

  clearScreen: function() {
    screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
  },

  redraw: function() {
    var ops = [];
    for (var i = allDrawOperations.length - 1; i >= 0; i--) {
      if (allDrawOperations[i].step < step && allDrawOperations[i].isClearScreen === true) {
        ops.push(allDrawOperations[i]);
        break;
      } else if (allDrawOperations[i].step < step) {
        ops.push(allDrawOperations[i]);
      }
    }

    ops.reverse().forEach(function(o) { o.fn(); });
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
  "clear-screen": langUtil.hasSideEffects(function(meta) {
    addOperation(function () {
      programFns.clearScreen();
    }, "clear-screen", true);
  }),

  write: langUtil.hasSideEffects(function(meta, str, x, y, color) {
    addOperation(function () {
      screen.font = "20px Georgia";
      screen.fillStyle = color;
      screen.fillText(str, x, y);
      screen.fillStyle = "black";
    }, "write");
  }),

  "draw-oval": langUtil.hasSideEffects(function(meta, x, y, w, h, filledStr, color) {
    addOperation(function () {
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
    }, "draw-oval");
  }),

  "draw-rectangle": langUtil.hasSideEffects(function(meta, x, y, width, height, filledStr, color) {
    addOperation(function () {
      if (filledStr === "unfilled") {
        screen.strokeStyle = color;
        screen.strokeRect(x, y, width, height);
        screen.strokeStyle = "black";
      } else if (filledStr === "filled") {
        screen.fillStyle = color;
        screen.fillRect(x, y, width, height);
        screen.fillStyle = "black";
      }
    }, "draw-rectangle");
  })
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
