var fs = require("fs");
var lang = require("./lang/interpreter");
var parse = lang.parse;
var interpret = lang.interpret;
var r = require("./runner");
var createEditor = require("./editor");
var createEnv = require("./env");

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

function start(code) {
  var screen = document.getElementById("screen").getContext("2d");
  var env = lang.createScope(createEnv(screen));

  try {
    var g = r(code, env);
    console.log("Parsed ok");

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
    if (e instanceof r.ParseError) {
      console.log(e.message);
    } else {
      throw e;
    }
  }
};

window.addEventListener("load", function() {
  var editor = createEditor(fs.readFileSync(__dirname + "/demo-program.txt", "utf8"));

  var tickStop = start(editor.getValue());
  editor.on("change", function() {
    if (tickStop !== undefined) {
      tickStop();
    }

    tickStop = start(editor.getValue());
  });
});
