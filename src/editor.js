var ace = require('brace');
require('brace/mode/scheme');
require('brace/theme/monokai');

var createEditor = module.exports = function(initialText) {
  var editor = ace.edit('editor');
  editor.setValue(initialText);
  editor.clearSelection(); // for some reason, setting the initial text selects everything
  editor.focus();
  editor.setTheme('ace/theme/monokai');

  editor.setOptions({
    fontFamily: "courier",
    fontSize: "11pt"
  });

  editor.renderer.setShowGutter(false);
  editor.getSession().setTabSize(2);
  editor.getSession().setUseSoftTabs(true);
  editor.getSession().setMode('ace/mode/scheme');
  editor.setHighlightActiveLine(false);

  return editor;
};
