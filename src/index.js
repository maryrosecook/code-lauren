var fs = require("fs");
var _ = require("underscore");
var $ = require("jquery");
var React = require('react');

require("babel-core/polyfill");

var ProgramPlayer = require("./player-interface.jsx");

var parser = require("./lang/parser");
var compile = require("./lang/compiler");
var vm = require("./lang/vm");

var createEditor = require("./editor");
var createAnnotator = require("./annotator");
var env = require("./env");
var setupPlayer = require("./program-player");

window.addEventListener("load", function() {
  var screen = document.getElementById("screen").getContext("2d");
  var editor = createEditor();
  var annotator = createAnnotator(editor);
  var player = setupPlayer();
  var canvasLib = env.setupCanvasLib(screen);

  React.render(React.createElement(ProgramPlayer, { player: player, annotator: annotator }),
               document.getElementById('programPlayer'));

  editor.on("change", function() {
    player.setProgramState(initProgramState(editor.getValue(), annotator, canvasLib));
  });

  editor.setValue(fs.readFileSync(__dirname + "/demo-program.txt", "utf8"));
});

function parse(code, annotator) {
  annotator.clear();

  try {
    parser.balanceParentheses(code);
    return parser.parse(code);
  } catch(e) {
    if (e instanceof parser.ParseError) {
      annotator.codeHighlight(code, e.i, e.i + 1, "error");
      annotator.lineMessage(code, e.i, "error", e.message);
    } else if (e instanceof parser.ParenthesisError) {
      annotator.codeHighlight(code, e.i, e.i + 1, "error");
      displayRainbowParentheses(code, annotator);

      annotator.lineMessage(code, e.i, "error", e.message);
    }
  }
};

function initProgramState(code, annotator, canvasLib) {
  var ast = parse(code, annotator);
  if (ast !== undefined) {
    var programEnv = env.createEnv(env.mergeLibraries(require("./lang/standard-library")(),
                                                      canvasLib.userFns));
    var ps = vm.initProgramState(code, compile(ast), programEnv);
    canvasLib.programFns.reset();
    ps.canvasLib = canvasLib.programFns;
    return ps;
  }
};

function displayRainbowParentheses(code, annotator) {
  parser.rainbowParentheses(code)
    .forEach(function(p, i) {
      p.map(function(offset) {
        annotator.codeHighlight(code, offset, offset + 1, "rainbow-" + i % 4);  });
    });
};
