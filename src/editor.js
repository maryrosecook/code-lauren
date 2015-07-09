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
