var ben = require("./lang/ben/interpreter");
var createEditor = require("./editor");
var createEnv = require("./env");

window.addEventListener("load", function() {
  var editor = createEditor();
  var screen = document.getElementById("screen").getContext("2d");
  var env = ben.createScope(createEnv(screen)); // will get mutated for now

  editor.on("change", function() {
    runCode(editor, env);
  });

  runCode(editor, env);
});

function runCode(editor, env) {
  try {
    return ben(editor.getValue(), env);
  } catch(e) {
    // no error messages, yet, so treat all errors as invalid syntax
    // that will soon be corrected
  }
};
