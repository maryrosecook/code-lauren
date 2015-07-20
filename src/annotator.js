var $ = require("jquery");
var _ = require("underscore");
var parser = require("./lang/parser");

module.exports = function createAnnotator(editor) {
  return new Annotator(editor);
};

function zeroLengthMarker(clazz) {
  var zeroLengthMarker = document.createElement("span");
  zeroLengthMarker.className = "zero-width-mark " + clazz;
  return zeroLengthMarker;
};

function Annotator(editor) {
  var markers = [];

  this.codeHighlight = function(code, start, end, clazz) {
    if (_.isNumber(start) && _.isNumber(end)) {

      // Mark any empty lines in the range.
      // Mostly useful for marking the return of undefined from a do.
      // But also useful for marking an empty line in a block of marked lines.
      emptyLineIndices(code, start, end).forEach(function(i) {
        var lAndC = parser.indexToLineAndColumn(i, code);
        var pos = { line: lAndC.line - 1, ch: lAndC.column - 1 };
        markers.push(editor.setBookmark(pos, { widget: zeroLengthMarker(clazz) }));
      });

      var startLAndC = parser.indexToLineAndColumn(start, code);
      var startPos = { line: startLAndC.line - 1, ch: startLAndC.column - 1 };

      if (start === end) {
        markers.push(editor.setBookmark(startPos, { widget: zeroLengthMarker(clazz) }));
      } else {
        var endLAndC = parser.indexToLineAndColumn(end, code);
        var endPos = { line: endLAndC.line - 1, ch: endLAndC.column - 1 };
        markers.push(editor.markText(startPos, endPos, { className: clazz }));
      }
    }
  };

  this.lineMessage = function(code, i, clazz, message) {
    var line = parser.indexToLineAndColumn(i, code).line;
    var currentLineMessageHolders = $("#line-messages");
    for (var i = 0; i < line; i++) {
      var inner = i === line - 1 ? "<span>" + message + "</span>" : "&nbsp;";
      currentLineMessageHolders.append("<div class='line-message'>" + inner + "</div>");
    }
  };

  this.clear = function() {
    markers.forEach(function(m) { m.clear(); });
    markers = [];
    $("#line-messages").empty();
  };
};

function emptyLineIndices(code, start, end) {
  var indices = [];
  var lastC = "\n";
  for (var i = start; i <= end; i++) {
    var c = code[i];
    if (c === "\n" && lastC === "\n") {
      indices.push(i);
    }

    lastC = c;
  }

  return indices;
};
