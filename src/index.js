var lang = require("./lang/lis");
var ace = require('brace');
require('brace/mode/javascript');
require('brace/theme/monokai');

console.log("loaded")

window.addEventListener("load", function() {
  var editor = ace.edit('editor');
  editor.getSession().setMode('ace/mode/javascript');
  editor.setTheme('ace/theme/monokai');
});
