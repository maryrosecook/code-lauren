var fs = require("fs");
var _ = require("underscore");

require("babel-core/polyfill");

var parser = require("./lang/parser");
var interpret = require("./lang/interpreter");
var r = require("./runner");
var createEditor = require("./editor");
var createAnnotator = require("./annotator");
var createEnv = require("./env");

window.addEventListener("load", function() {
  var editor = createEditor(fs.readFileSync(__dirname + "/demo-program.txt", "utf8"));
  var annotator = createAnnotator(editor.getSession());

  var tickStop = start(editor, annotator);
  editor.on("change", function() {
    if (tickStop !== undefined) {
      tickStop();
    }

    tickStop = start(editor, annotator);
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

function parse(code, annotator) {
  try {
    parser.balanceParentheses(code);

    var ast = parser.parseSyntax(code);
    console.log("Parsed ok");
    return ast;
  } catch(e) {
    if (e instanceof parser.ParseError) {
      annotator.codeHighlight(code, e.i, "error");
      annotator.lineMessage(code, e.i, "error", e.message);
    } else if (e instanceof parser.ParenthesisError) {
      annotator.codeHighlight(code, e.i, "error");
      displayRainbowParentheses(code, annotator);

      annotator.lineMessage(code, e.i, "error", e.message);
    }

    throw e;
  }
};

function start(editor, annotator) {
  var code = editor.getValue();
  var screen = document.getElementById("screen").getContext("2d");
  var env = interpret.createScope(createEnv(screen));

  annotator.clear();

  try {
    var ast = parse(code, annotator);

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
  } catch (e) {
    console.log(e.message);
  }
};

function displayRainbowParentheses(code, annotator) {
  parser.rainbowParentheses(code)
    .forEach(function(p, i) {
      p.map(function(offset) {
        annotator.codeHighlight(code, offset, "rainbow-" + i % 4);  });
    });
};
