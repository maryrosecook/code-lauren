var _ = require("underscore");
var im = require("immutable");

var langUtil = require("./lang-util");
var chk = require("./check-args");

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

  shutDown: function() {
    clearInterval(flushIntervalId);
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

    // clear screen to handle broken program add clear-screen() to ops
    // to handle initial clear screen on program execution when
    // stepping backwards through programs without an explicit
    // clear-screen()
    screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
    userFns.get("clear-screen")();
  }
};

var userFns = im.Map({
  "clear-screen": langUtil.setSideEffecting(function(meta) {
    addOperation(function () {
      programFns.clearScreen();
    }, "clear-screen", true);
  }),

  write: langUtil.setSideEffecting(function(meta, str, x, y, color) {
    chk(arguments,
        chk.any("something to write to the screen"),
        chk.num("the distance from the left of the screen"),
        chk.num("the distance from the top of the screen"),
        chk.set(COLORS, "the color of the text"));

    addOperation(function () {
      screen.font = "20px Georgia";
      screen.fillStyle = color;
      screen.fillText(str, x, y);
      screen.fillStyle = "black";
    }, "write");
  }),

  "draw-oval": langUtil.setSideEffecting(function(meta, x, y, w, h, filledStr, color) {
    chk(arguments,
        chk.num("the distance from the left of the screen"),
        chk.num("the distance from the top of the screen"),
        chk.num("the width"),
        chk.num("the height"),
        chk.set(["filled", "unfilled"], 'either "filled" or "unfilled"'),
        chk.set(COLORS, "the color of the oval"));

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

  "draw-rectangle": langUtil.setSideEffecting(function(meta, x, y, width, height, filledStr, color) {
    chk(arguments,
        chk.num("the distance from the left of the screen"),
        chk.num("the distance from the top of the screen"),
        chk.num("the width"),
        chk.num("the height"),
        chk.set(["filled", "unfilled"], 'either "filled" or "unfilled"'),
        chk.set(COLORS, "the color of the rectangle"));

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
});

var api = {
  programFns: programFns,
  userFns: userFns
};

var setScreen = module.exports = function(inScreen) {
  if (screen !== undefined) { throw new Error("Already started"); }

  // run any unflushed cached ops - might get left if draw ops done,
  // program hasn't terminated and are outside a loop or loop has
  // ended
  flushIntervalId = setInterval(programFns.flush, 100);

  screen = inScreen;

  return api;
};

function set(legalValues) {
  return createSpec(message, function(arg) {
    return legalValues.indexOf();
  });
};

var COLORS = [
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blanchedalmond",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "green",
  "greenyellow",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "rebeccapurple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen"
];
