var ace = require('brace');
require('./mode-lauren');
require('./theme-lauren');

require('./ace-requires');

var createEditor = module.exports = function(initialText) {
  var editor = ace.edit('editor');
  editor.setValue(initialText);
  editor.clearSelection(); // for some reason, setting the initial text selects everything
  editor.focus();
  editor.setTheme('ace/theme/lauren');

  editor.setOptions({
    fontFamily: "courier",
    fontSize: "14pt"
  });

  editor.renderer.setShowGutter(false);
  editor.getSession().setTabSize(2);
  editor.getSession().setUseSoftTabs(true);
  editor.getSession().setMode("ace/mode/lauren");
  editor.setShowPrintMargin(false);
  editor.setHighlightActiveLine(false);
  editor.setDisplayIndentGuides(false)

  return editor;
};
