var fs = require("fs");
var _ = require("underscore");
var $ = require("jquery");
var React = require('react');

// require css
require("../resources/jquery.jscrollpane.css");
require("../resources/simplescrollbars.css");
require("../resources/codemirror.css");
require("../resources/main.css");

// analytics
require("./analytics");

require("babel-core/polyfill");
require("./top");

var ProgramPlayer = require("./player-interface.jsx");

var parser = require("./lang/parser");
var compile = require("./lang/compiler");
var vm = require("./lang/vm");

var createEditor = require("./editor");
var createAnnotator = require("./annotator");
var env = require("./env");
var setupPlayer = require("./program-player");
var Sidebar = require("./sidebar.jsx");
var setupSource = require("./source");

window.addEventListener("load", function() {
  var screen = $("#screen")[0].getContext("2d");
  var editor = createEditor();
  var annotator = createAnnotator(editor);
  var canvasLib = env.setupCanvasLib(screen);
  var source = setupSource(editor);

  // export globally
  top.pub.sidebar = React.render(React.createElement(Sidebar), $("#sidebar")[0]);
  top.pub.editor = editor;

  var player = React.render(React.createElement(ProgramPlayer,
                                                { player: setupPlayer(annotator),
                                                  annotator: annotator }),
                            $("#program-player")[0]);

  editor.on("change", function() {
    player.setProgramState(initProgramState(editor.getValue(), annotator, canvasLib));
    source.save();
  });

  editor.setValue(source.get() !== undefined ?
                  source.get() :
                  fs.readFileSync(__dirname + "/demo-program.txt", "utf8"));
});

function parse(code, annotator) {
  annotator.clear();

  try {
    parser.balanceParentheses(code);
    return parser.parse(code);
  } catch(e) {
    if (e instanceof parser.ParseError) {
      annotator.codeHighlight(code, e.s, e.e, "error");
      annotator.lineMessage(code, e.s, "error", e.message);
    } else if (e instanceof parser.ParenthesisError) {
      annotator.codeHighlight(code, e.s, e.e, "error");
      displayRainbowParentheses(code, annotator);

      annotator.lineMessage(code, e.s, "error", e.message);
    }
  }
};

function initProgramState(code, annotator, canvasLib) {
  canvasLib.programFns.reset();
  var ast = parse(code, annotator);
  if (ast !== undefined) {
    var programEnv = env.createEnv(env.mergeLibraries(require("./lang/standard-library")(),
                                                      canvasLib.userFns));
    var ps = vm.initProgramState(code, compile(ast), programEnv);
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
