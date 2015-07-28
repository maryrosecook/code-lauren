var fs = require("fs");
var _ = require("underscore");
var $ = require("jquery");
var React = require('react');

// require css
require("../resources/jquery.jscrollpane.css");
require("../resources/simplescrollbars.css");
require("../resources/codemirror.css");
require("../resources/main.css");

// analytics
require("./analytics");

require("babel-core/polyfill");
require("./top");

var Topbar = require("./topbar.jsx");
var Sidebar = require("./sidebar.jsx");

var createEditor = require("./editor");
var setupSource = require("./source");
var createAnnotator = require("./annotator");

window.addEventListener("load", function() {
  var editor = createEditor();
  var source = setupSource(editor);

  React.render(React.createElement(Topbar,
                                   { editor: editor, annotator: createAnnotator(editor) }),
               $("#topbar")[0]);

  // export globally
  top.pub.sidebar = React.render(React.createElement(Sidebar), $("#sidebar")[0]);
  top.pub.editor = editor;
  top.pub.codeToFailedParseStack = require("./lang/parser-state-error").codeToFailedParseStack;

  editor.on("change", function() {
    source.save();
  });

  editor.setValue(source.get() !== undefined ?
                  source.get() :
                  fs.readFileSync(__dirname + "/demo-program.txt", "utf8"));
});
