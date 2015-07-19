var fs = require("fs");
var path = require("path");
var _ = require("underscore");
var marked = require("marked");

var PAGES_PATH = __dirname + "/../pages";

function buildPages() {
  try {
    var pages = fs.readdirSync(PAGES_PATH)
        .filter(function(n) { return n.match(/\.md$/); })
        .map(function(n) { return path.join(PAGES_PATH, n); })
        .map(function(filePath) {
          return {
            name: filePath.match(/^.+\/([A-Za-z0-9-]+)\.md$/)[1],
            string: marked(makeLinksOnClick(fs.readFileSync(filePath, "utf8")))
          };
        }).reduce(function(a, o) {
          a[o.name] = o.string;
          return a
        }, {});

    fs.writeFileSync(path.join(PAGES_PATH, "/all-pages.js"),
                     "module.exports = " + JSON.stringify(pages));
    console.log("Rebuilt");
  } catch (e) {
    console.log("Rebuild failed:", e.message);
  }
};

function matchIndices(regex, str) {
  var match;
  var indices = [];
  var regex = new RegExp(regex, 'g');

  while (match = regex.exec(str)) {
    indices.push([match.index, match.index+match[0].length]);
  }

  return indices;
};

function maybeMarkdownLinkToOnClick(link) {
  var pageMatch = link.match(/\(#([^\)]+)\)$/);
  if (pageMatch) {
    var pageName = pageMatch[1];
    var text = link.match(/^\[([^\]]+)\]/)[1];
    return ['<a href="#', pageName, '"',
            'onclick="return top.sidebar.load(',
            "'", pageName, "'",
            '); return false;"',
            '>',
            text,
            "</a>"].join("");
  } else {
    return link;
  }
};

function makeLinksOnClick(md) {
  var linkIndices = matchIndices("\\[[^\\]]+\\]\\(#[^)]+\\)", md);
  var links = linkIndices
      .map(function(range) { return md.slice(range[0], range[1]); })
      .map(maybeMarkdownLinkToOnClick);

  var allIndices = [[undefined, 0]].concat(linkIndices).concat([[md.length]]);

  var nonLinks = [];
  for (var i = 1; i < allIndices.length; i++) {
    nonLinks.push(md.slice(allIndices[i - 1][1], allIndices[i][0]));
  }

  return _.compact(_.flatten(_.zip(nonLinks, links))).join("");
};

buildPages();

// rebuild pages when something in on change
fs.watch(__dirname + "/../pages", function (event, filename) {
  if (filename.match(/\.md$/)) {
    buildPages();
  }
});
