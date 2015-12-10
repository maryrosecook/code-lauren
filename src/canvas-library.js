var _ = require("underscore");
var im = require("immutable");

var langUtil = require("./lang/lang-util");
var chk = require("./lang/check-args");

var screen;
var step = 0;
var allDrawOperations = [];
var drawOperationsSinceLastRepaint = [];

function makeOperation(fn, name, isClearScreen) {
  return {
    fn: fn,
    step: step,
    name: name,
    isClearScreen: isClearScreen === true ? true : false
  };
};

function addOperation(op) {
  allDrawOperations.push(op);
  drawOperationsSinceLastRepaint.push(op);

  if (allDrawOperations.length > 5000) {
    allDrawOperations.shift();
  }
};

var program = {
  flush: function() {
    drawOperationsSinceLastRepaint
      .filter(function(o) { return o.isClearScreen === false;  })
      .forEach(function(o) { o.fn(); });
    drawOperationsSinceLastRepaint = [];
  },

  runDrawOperationsSinceLastRepaint: function() {
    drawOperationsSinceLastRepaint.forEach(function(o) { o.fn(); });
    drawOperationsSinceLastRepaint = [];
  },

  play: function() {
    // the thing where you see a drawing part reappear after stepping
    // back past it then pressing play is because the current
    // instruction is inside code where the draw is already a foregone
    // conclusion eg if current instruction is one of the args to
    // draw-oval in code below
    // if mouse-button-is-down { draw-oval(1 1 1 1 "filled" "red") }

    drawOperationsSinceLastRepaint = []
    for (var i = allDrawOperations.length - 1; i >= 0; i--) {
      if (allDrawOperations[i].step < step) {
        break;
      }
    }

    allDrawOperations.splice(i + 1);
  },

  stepForwards: function() {
    step++;
  },

  stepBackwards: function() {
    step--;
    program.redraw();
  },

  pause: function() {
    program.redraw();
  },

  hitClearScreen: function() {
    return _.find(drawOperationsSinceLastRepaint,
                  function(o) { return o.isClearScreen === true; }) !== undefined;
  },

  clearScreen: function() {
    screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
  },

  redraw: function() {
    var ops = [];
    var foundClearScreen = false;
    for (var i = allDrawOperations.length - 1; i >= 0; i--) {
      if (allDrawOperations[i].step < step) {
        ops.push(allDrawOperations[i]);
        if(allDrawOperations[i].isClearScreen === true) {
          foundClearScreen = true;
          break;
        }
      }
    }

    if (!foundClearScreen) {
      ops.push(makeOperation(function() {
        program.clearScreen();
      }, "clear-screen", true));
    }

    ops.reverse().forEach(function(o) { o.fn(); });
  },

  reset: function() {
    step = 0;
    allDrawOperations = [];
    drawOperationsSinceLastRepaint = [];

    // clear screen to handle broken program add clear-screen() to ops
    // to handle initial clear screen on program execution when
    // stepping backwards through programs without an explicit
    // clear-screen()
    screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
    user.get("clear-screen")();
  }
};

var user = im.Map({
  "clear-screen": langUtil.setSideEffecting(function(meta) {
    addOperation(makeOperation(function () {
      program.clearScreen();
    }, "clear-screen", true));
  }),

  write: langUtil.setSideEffecting(function(meta, str, x, y, color) {
    chk(arguments,
        chk.any("something to write to the screen"),
        chk.num("the distance from the left of the screen"),
        chk.num("the distance from the top of the screen"),
        chk.set(COLORS, "the color of the text"));

    addOperation(makeOperation(function () {
      screen.font = "20px Georgia";
      screen.fillStyle = color;
      screen.fillText(str, x, y);
      screen.fillStyle = "black";
    }, "write"));
  }),

  "draw-oval": langUtil.setSideEffecting(function(meta, x, y, w, h, filledStr, color) {
    chk(arguments,
        chk.num("the distance of the center of the oval from the left of the screen"),
        chk.num("the distance of the center of the oval from the top of the screen"),
        chk.num("the width"),
        chk.num("the height"),
        chk.set(["filled", "unfilled"], 'either "filled" or "unfilled"'),
        chk.set(COLORS, "the color of the oval"));

    addOperation(makeOperation(function () {
      var left = x - w / 2;
      var top = y - h / 2;
      var kappa = 0.5522848;
      var ox = (w / 2) * kappa; // control point offset horizontal
      var oy = (h / 2) * kappa; // control point offset vertical
      var xe = left + w;           // x-end
      var ye = top + h;           // y-end
      var xm = left + w / 2;       // x-middle
      var ym = top + h / 2;       // y-middle

      screen.beginPath();
      screen.moveTo(left, ym);
      screen.bezierCurveTo(left, ym - oy, xm - ox, top, xm, top);
      screen.bezierCurveTo(xm + ox, top, xe, ym - oy, xe, ym);
      screen.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
      screen.bezierCurveTo(xm - ox, ye, left, ym + oy, left, ym);

      if (filledStr === "unfilled") {
        screen.strokeStyle = color;
        screen.stroke();
        screen.strokeStyle = "black";
      } else if (filledStr === "filled") {
        screen.fillStyle = color;
        screen.fill();
        screen.fillStyle = "black";
      }
    }, "draw-oval"));
  }),

  "draw-rectangle": langUtil.setSideEffecting(function(meta, x, y, width, height, filledStr, color) {
    chk(arguments,
        chk.num("the distance of the center of the rectangle from the left of the screen"),
        chk.num("the distance of the center of the rectangle from the top of the screen"),
        chk.num("the width"),
        chk.num("the height"),
        chk.set(["filled", "unfilled"], 'either "filled" or "unfilled"'),
        chk.set(COLORS, "the color of the rectangle"));

    addOperation(makeOperation(function () {
      var left = x - width / 2;
      var top = y - height / 2;
      if (filledStr === "unfilled") {
        screen.strokeStyle = color;
        screen.strokeRect(left, top, width, height);
        screen.strokeStyle = "black";
      } else if (filledStr === "filled") {
        screen.fillStyle = color;
        screen.fillRect(left, top, width, height);
        screen.fillStyle = "black";
      }
    }, "draw-rectangle"));
  }),

  "random-color": function() {
    return COLORS[Math.floor(Math.random() * (COLORS.length - 1))];
  },

  "rectangle-overlapping-rectangle": function(meta, x1, y1, w1, h1, x2, y2, w2, h2) {
    chk(arguments,
        chk.num("the distance of the center of the first rectangle from left of the screen"),
        chk.num("the distance of the center of the first rectangle from top of the screen"),
        chk.num("the width of the first rectangle"),
        chk.num("the height of the first rectangle"),
        chk.num("the distance of the center of the second rectangle from left of the screen"),
        chk.num("the distance of the center of the second rectangle from top of the screen"),
        chk.num("the width of the second rectangle"),
        chk.num("the height of the second rectangle"));

    return !(x1 + w1 / 2 < x2 - w2 / 2 ||
             y1 + h1 / 2 < y2 - h2 / 2 ||
             x1 - w1 / 2 > x2 + w2 / 2 ||
             y1 - h1 / 2 > y2 + h2 / 2);
  },
});

var api = {
  program: program,
  user: user
};

var setScreen = module.exports = function(inScreen) {
  if (screen !== undefined) { throw new Error("Already started"); }

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
  "forestgreen",
  "fuchsia",
  "gainsboro",
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
  "lightgreen",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightsteelblue",
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
  "yellow",
  "yellowgreen",
  "white"
];
