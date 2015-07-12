var fs = require("fs");
var path = require("path");
var marked = require("marked");

var PAGES_PATH = __dirname + "/../pages";

function buildPages() {
  var pages = fs.readdirSync(PAGES_PATH)
      .filter(function(n) { return n.match(/\.md$/); })
      .map(function(n) { return path.join(PAGES_PATH, n); })
      .map(function(filePath) {
        return {
          name: filePath.match(/^.+\/([A-Za-z0-9-]+)\.md$/)[1],
          string: marked(fs.readFileSync(filePath, "utf8"))
        };
      }).reduce(function(a, o) {
        a[o.name] = o.string;
        return a
      }, {});

  fs.writeFileSync(path.join(PAGES_PATH, "/all-pages.js"),
                   "module.exports = " + JSON.stringify(pages));
};

// rebuild pages when something in on change
fs.watch(__dirname + "/../pages", function (event, filename) {
  if (filename.match(/\.md$/)) {
    buildPages();
  }
});
