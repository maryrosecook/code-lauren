var $ = require("jquery");

var CodeMirror = require('codemirror');
require("./lib/simplescrollbars.js"); // codemirror scrollbar plugin
require('./mode-lauren');

var sourceSaver = require("./source-saver");

var createEditor = module.exports = function() {
  var editor = CodeMirror(document.body, {
    mode:  "lauren",
    tabSize: 2,
    indentWithTabs: false,
    undoDepth: 1000,
    autofocus: true,
    scrollbarStyle: "simple",
    extraKeys: {
      Tab: function(cm) { cm.execCommand("insertSoftTab"); }
    }
  });

  var saveProgramTimer;
  editor.on("change", function() {
    clearTimeout(saveProgramTimer);
    saveProgramTimer = setTimeout(function() {
      sourceSaver.save(editor.getValue());
    }, 1000);
  });

    // restore focus to editor if user ever starts typing
  $(window).keydown(function(e) {
    if (e.ctrlKey === false && e.metaKey === false && $("#searchbox").is(":focus") === false) {
      editor.focus();
    }

    // recalc place to put top of scrollbar on keypress - bug in cm
    // simplescrollbars and leaves bar way too far down on content
    // size change
    editor.display.scrollbars.horiz.moveTo(editor.display.scrollbars.horiz);
    editor.display.scrollbars.vert.moveTo(editor.display.scrollbars.vert.pos);
  });

  return editor;
};
