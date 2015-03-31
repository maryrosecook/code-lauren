var ben = require("./lang/ben/interpreter.js");
var ace = require('brace');
require('brace/mode/scheme');
require('brace/theme/monokai');

window.addEventListener("load", function() {
  var editor = setupEditor();
  var screen = document.getElementById("screen").getContext("2d");
  var env = ben.createScope(createLibrary(screen)); // will get mutated for now

  editor.on("change", function() {
    runCode(editor, env);
  });

  runCode(editor, env);
});

function setupEditor() {
  var editor = ace.edit('editor');
  editor.setValue('(write-text "Hello, world" 12 30 "black")');
  editor.clearSelection(); // for some reason, setting the initial text selects everything
  editor.setTheme('ace/theme/monokai');
  editor.renderer.setShowGutter(false);
  editor.getSession().setTabSize(2);
  editor.getSession().setUseSoftTabs(true);
  editor.getSession().setMode('ace/mode/scheme');
  editor.setHighlightActiveLine(false);
  return editor;
};

function createLibrary(screen) {
  function mergeLibrary(library, libraryToAdd) {
    for (var i in libraryToAdd) {
      if (i in library) {
        throw "Name clash in merged libraries. Aborting.";
      } else {
        library[i] = libraryToAdd[i];
      }
    }

    return library;
  };

  return mergeLibrary(mergeLibrary({}, require("./lang/ben/standard-library")),
                      require("./lang/ben/canvas-library")(screen));
};

function runCode(editor, env) {
  var code = editor.getValue();

  try {
    return ben(code, env);
  } catch(e) {
    // no error messages, yet, so treat all errors as invalid syntax
    // that will soon be corrected
  }
};
