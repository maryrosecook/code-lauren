var lang = require("./lang/ben/interpreter");
var parse = lang.parse;
var interpret = lang.interpret;
var r = require("./runner");
var createEditor = require("./editor");
var createEnv = require("./env");

window.addEventListener("load", function() {
  var editor = createEditor('(print "one") (print "two")');
  var screen = document.getElementById("screen").getContext("2d");
  var env = lang.createScope(createEnv(screen)); // will get mutated for now

  var interval;

  function restart() {
    clearInterval(interval);

    var g;
    try {
      g = r(editor.getValue(), env);
    } catch (e) {
      if (e instanceof r.ParseError) {
        console.log(e.message);
        return;
      } else {
        throw e;
      }
    }

    console.log("Parsed ok");

    interval = setInterval(function() {
      try {
        r.step(g);
      } catch (e) {
        if (e instanceof r.DoneError) {
          clearInterval(interval);
          console.log("Program complete.");
        } else if (e instanceof r.RuntimeError) {
          console.log(e.stack);
        } else {
          console.log(e.stack);
        }
      }
    }, 1000);
  };

  editor.on("change", function() {
    restart();
  });

  restart();
});
