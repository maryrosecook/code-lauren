require("babel-core/polyfill");

var fs = require("fs");
var _ = require("underscore");

var parser = require("./lang/parser");
var interpret = require("./lang/interpreter");
var r = require("./runner");
var createEditor = require("./editor");
var createEnv = require("./env");
var range = ace.acequire("ace/range");

window.addEventListener("load", function() {
  var editor = createEditor(fs.readFileSync(__dirname + "/demo-program.txt", "utf8"));
  var errorDisplayer = new ErrorDisplayer(editor.getSession());

  var tickStop = start(editor, errorDisplayer);
  editor.on("change", function() {
    if (tickStop !== undefined) {
      tickStop();
    }

    tickStop = start(editor, errorDisplayer);
  });
});

function step(g) {
  try {
    r.step(g);
  } catch (e) {
    if (e instanceof r.DoneError) {
      console.log("Program complete.");
    } else if (e instanceof r.RuntimeError) {
      console.log(e.stack);
    } else {
      console.log(e.stack);
    }
  }
};

function parse(code, errorDisplayer) {
  try {
    parser.balanceParentheses(code);

    var ast = parser.parseSyntax(code);
    console.log("Parsed ok");
    return ast;
  } catch(e) {
    if (e instanceof parser.ParseError) {
      console.log(e);
      errorDisplayer.display(code, e.i, "error");
    } else if (e instanceof parser.ParenthesisError) {
      console.log(e.message);
      errorDisplayer.display(code, e.i, "", "error");
      displayRainbowParentheses(code, errorDisplayer);
    } else {
      throw e;
    }
  }
};

function start(editor, errorDisplayer) {
  var code = editor.getValue();
  var screen = document.getElementById("screen").getContext("2d");
  var env = interpret.createScope(createEnv(screen));

  errorDisplayer.clear();

  var ast = parse(code, errorDisplayer);
  var g = r(ast, env);

  var going = true;
  (function tick() {
    if (going) {
      step(g);
      requestAnimationFrame(tick);
    }
  })();

  return function() {
    going = false;
  };
};

function ErrorDisplayer(editSession) {
  var markerIds = [];

  this.display = function(code, i, message, clazz) {
    if (_.isNumber(i)) {
      var landC = parser.indexToLineAndColumn(i, code);
      var r = new range.Range(landC.line - 1, landC.column - 1, landC.line - 1, landC.column);
      markerIds.push(editSession.addMarker(r, "ace_parse_annotation " + clazz, "text", true));
    }
  };

  this.clear = function() {
    markerIds.forEach(function(x) { editSession.removeMarker(x); });
    markerIds = [];
  };
};

function displayRainbowParentheses(code, errorDisplayer) {
  parser.rainbowParentheses(code)
    .forEach(function(p, i) {
      p.map(function(offset) {
        errorDisplayer.display(code, offset, "", "rainbow-" + i % 5);  });
    });
};
