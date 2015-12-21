var _ = require("underscore");
var im = require("immutable");

var util = require("./util");
var langUtil = require("./lang/lang-util");
var chk = require("./lang/check-args");
var env = require("./env");

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
    // draw-circle in code below
    // if mouse-button-is-down { draw-circle(1 1 1 1 "filled" "red") }

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
    user.getIn(["clear-screen", "fn"])();
  }
};

var user = im.Map({
  "clear-screen": langUtil.createBuiltinOutputting(function(meta) {
    addOperation(makeOperation(function () {
      program.clearScreen();
    }, "clear-screen", true));
  }),

  draw: langUtil.createBuiltinOutputting(function(meta, drawable) {
    chk(arguments,
        chk.anyType(["rectangle", "circle", "text"], "a shape or a piece of text to draw"));

    addOperation(makeOperation(function () {
      drawFns[drawable.get("type")](drawable);
    }, "draw"));
  }),

  "random-color": langUtil.createBuiltinNormal(function() {
    return COLORS_WITHOUT_GRAYSCALE[
      Math.floor(Math.random() * (COLORS_WITHOUT_GRAYSCALE.length - 1))
    ];
  }),

  "are-overlapping": langUtil.createBuiltinNormal(function(meta, s1, s2) {
    chk(arguments,
        chk.anyType(["rectangle", "circle"], "a shape"),
        chk.anyType(["rectangle", "circle"], "another shape"));

    var collisionTestFn = overlappingFns[s1.get("type") + " " + s2.get("type")];
    if (collisionTestFn !== undefined) {
      return collisionTestFn(s1, s2);
    } else {
      throw new Error("Could not find collision test function.");
    };
  }),

  "make-rectangle": langUtil.createBuiltinNormal(function(meta, x, y, width, height) {
    chk(arguments,
        chk.num("the x coordinate of the center of the rectangle"),
        chk.num("the y coordinate of the center of the rectangle"),
        chk.num("the width"),
        chk.num("the height"));

    return im.Map({x: x, y: y, width: width, height: height,
                   filled: true, color: "black", type: "rectangle"});
  }),

  "make-circle": langUtil.createBuiltinNormal(function(meta, x, y, width) {
    chk(arguments,
        chk.num("the x coordinate of the center of the circle"),
        chk.num("the y coordinate of the center of the circle"),
        chk.num("the width"));

    return im.Map({x: x, y: y, width: width,
                   filled: true, color: "black", type: "circle"});
  }),

  "make-text": langUtil.createBuiltinNormal(function(meta, x, y, text) {
    chk(arguments,
        chk.num("the x coordinate of the center of the text"),
        chk.num("the y coordinate of the center of the text"),
        chk.numOrBooleanOrString("some words or a number"));

    return im.Map({x: x, y: y, text: text, color: "black", type: "text" });
  }),

  distance: langUtil.createBuiltinNormal(function(meta, s1, s2) {
    chk(arguments,
        chk.anyType(["rectangle", "circle"], "a shape"),
        chk.anyType(["rectangle", "circle"], "another shape"));

    return shapeDistance(s1, s2);
  })
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

var drawFns = {
  rectangle: function(r) {
    var left = r.get("x") - r.get("width") / 2;
    var top = env.yInvert(r.get("y")) - r.get("height") / 2;
    if (r.get("filled") === true) {
      screen.fillStyle = r.get("color");
      screen.fillRect(left, top, r.get("width"), r.get("height"));
      screen.fillStyle = "black";
    } else if (r.get("filled") === false) {
      screen.strokeStyle = r.get("color");
      screen.strokeRect(left, top, r.get("width"), r.get("height"));
      screen.strokeStyle = "black";
    }
  },

  circle: function(o) {
    screen.beginPath();
    screen.arc(o.get("x"), env.yInvert(o.get("y")), o.get("width") / 2, 0, 2 * Math.PI);
    screen.closePath()

    if (o.get("filled") === true) {
      screen.fillStyle = o.get("color");
      screen.fill();
      screen.fillStyle = "black";
    } else if (o.get("filled") === false) {
      screen.strokeStyle = o.get("color");
      screen.stroke();
      screen.strokeStyle = "black";
    }
  },

  text: function(t) {
    screen.font = "20px Georgia";
    screen.textAlign = "center";
    screen.textBaseline = "middle";
    screen.fillStyle = t.get("color");
    screen.fillText(t.get("text"), t.get("x"), env.yInvert(t.get("y")));
    screen.fillStyle = "black";
  }
};

var overlappingFns = {
  // only works for unrotated rectangles
  // when introduce rotation will need to change this
  "rectangle rectangle": function(s1, s2) {
    var x1 = s1.get("x");
    var y1 = env.yInvert(s1.get("y"));
    var w1 = s1.get("width");
    var h1 = s1.get("height");
    var x2 = s2.get("x");
    var y2 = env.yInvert(s2.get("y"));
    var w2 = s2.get("width");
    var h2 = s2.get("height");
    return !(x1 + w1 / 2 < x2 - w2 / 2 ||
             y1 + h1 / 2 < y2 - h2 / 2 ||
             x1 - w1 / 2 > x2 + w2 / 2 ||
             y1 - h1 / 2 > y2 + h2 / 2);
  },

  "circle circle": function(s1, s2) {
    return shapeDistance(s1, s2) <= s1.get("width") / 2 + s2.get("width") / 2;
  },

  // only works for unrotated rectangles
  // when introduce rotation will need to change this
  "rectangle circle": function(r, c) {
    var rX = parseFloat(r.get("x"));
    var rY = parseFloat(env.yInvert(r.get("y")));
    var rWidth = parseFloat(r.get("width"));
    var rHeight = parseFloat(r.get("height"));

    var cX = parseFloat(c.get("x"));
    var cY = parseFloat(env.yInvert(c.get("y")));
    var cWidth = parseFloat(c.get("width"));

    var closestX = 0;
    var closestY = 0;

    if (cX < rX - rWidth / 2) {
      closestX = rX - rWidth / 2;
    } else if (cX > rX + rWidth / 2) {
      closestX = rX + rWidth / 2;
    } else {
      closestX = cX;
    }

    if (cY < rY - rHeight / 2) {
      closestY = rY - rHeight / 2;
    } else if (cY > rY + rHeight / 2) {
      closestY = rY + rHeight / 2;
    } else {
      closestY = cY;
    }

    return distance(cX, cY, closestX, closestY) < cWidth / 2;
  },

  "circle rectangle": function(c, r) {
    return overlappingFns["rectangle circle"](r, c);
  }
};

function distance(x1, y1, x2, y2) {
  var x = Math.abs(x1 - x2);
  var y = Math.abs(y1 - y2);

  return Math.sqrt((x * x) + (y * y));
};

function shapeDistance(s1, s2) {
  var x1 = parseFloat(s1.get("x"));
  var y1 = parseFloat(env.yInvert(s1.get("y")));
  var x2 = parseFloat(s2.get("x"));
  var y2 = parseFloat(env.yInvert(s2.get("y")));
  return distance(x1, y1, x2, y2);
};

var COLORS_WITH_GRAYSCALE = [
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
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dodgerblue",
  "firebrick",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "gold",
  "goldenrod",
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

var COLORS_GREYSCALE = ["white", "black", "gray"];

var COLORS_WITHOUT_GRAYSCALE = _.difference(COLORS_WITH_GRAYSCALE, COLORS_GREYSCALE);
