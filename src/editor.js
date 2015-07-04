var CodeMirror = require('codemirror');
require('./mode-lauren');

var createEditor = module.exports = function() {
  var editor = CodeMirror(document.body, {
    mode:  "lauren",
    tabSize: 2,
    indentWithTabs: false,
    undoDepth: 9999999999,
    autofocus: true,
    extraKeys: {
      Tab: function(cm) { cm.execCommand("insertSoftTab"); }
    }
  });

  return editor;
};

function wrapSetValueToNotSelectAllText(editor) {
  var realSetValue = editor.setValue;

  editor.setValue = function(value) {
    realSetValue.bind(editor)(value);
    editor.clearSelection(); // for some reason, setting the initial text selects everything
  };
};
