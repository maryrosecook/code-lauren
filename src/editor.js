var CodeMirror = require('codemirror');
require("./lib/simplescrollbars.js"); // for codemirror scrollbars
require('./mode-lauren');

var createEditor = module.exports = function() {
  var editor = CodeMirror(document.body, {
    mode:  "lauren",
    tabSize: 2,
    indentWithTabs: false,
    undoDepth: 9999999999,
    autofocus: true,
    scrollbarStyle: "simple",
    extraKeys: {
      Tab: function(cm) { cm.execCommand("insertSoftTab"); }
    }
  });

  return editor;
};
