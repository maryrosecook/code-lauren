var $ = require("jquery");
var _ = require("underscore");
var parser = require("./lang/parser");

module.exports = function createAnnotator(editor) {
  return new Annotator(editor);
};

var zeroLengthMarker = document.createElement("span");
zeroLengthMarker.className = "zero-width-mark currently-executing";

function Annotator(editor) {
  var markers = [];

  this.codeHighlight = function(code, start, end, clazz) {
    if (_.isNumber(start) && _.isNumber(end)) {
      var startLAndC = parser.indexToLineAndColumn(start, code);
      var startPos = { line: startLAndC.line - 1, ch: startLAndC.column - 1 };

      if (start === end) {
        markers.push(editor.setBookmark(startPos, { widget: zeroLengthMarker }));
      } else {
        var endLAndC = parser.indexToLineAndColumn(end, code);
        var endPos = { line: endLAndC.line - 1, ch: endLAndC.column - 1 };

        // Add overhang if marked char is actually off end of line.
        // This happens because cm doesn't support extending markers
        // outside text in this context and if we marked the first char
        // of the next line it would look a bit weird to the user.
        var overhangClass = isOffEndOfLine(code, start) || start === end ? " overhang" : "";

        markers.push(editor.markText(startPos,
                                     endPos,
                                     { className: [clazz,
                                                   overhangClass].join(" ") }));
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

function isOffEndOfLine(code, i) {
  var lAndC = parser.indexToLineAndColumn(i, code);
  var lineStr = code.split("\n")[lAndC.line - 1];
  return lineStr === undefined || lineStr[lAndC.column - 1] === undefined;
};
