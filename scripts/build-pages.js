var fs = require("fs");
var path = require("path");
var _ = require("underscore");
var marked = require("marked");

var PAGES_PATH = __dirname + "/../pages";

function buildPages() {
  try {
    checkPageLinks(readPagesWithPaths());

    var pages = readPagesWithPaths()
      .map(function(pageWithPath) {
        return {
          slug: pathToSlug(pageWithPath.path),
          html: marked(makeLinksOnClick(pageWithPath.page)),
          string: pageWithPath.page
        };
      }).reduce(function(a, o) {
        a[o.slug] = { string: o.string, html: o.html, slug: o.slug };
        return a
      }, {});

    fs.writeFileSync(path.join(PAGES_PATH, "/all-pages.js"),
                     "module.exports = " + JSON.stringify(pages));
    console.log("Rebuilt");
  } catch (e) {
    console.log("Rebuild failed:", e.message);
  }
};

function pathToSlug(path) {
  return path.match(/^.+\/([A-Za-z0-9-]+)\.md$/)[1];
};

function readPagesWithPaths() {
  return fs
    .readdirSync(PAGES_PATH)
    .filter(function(n) { return n.match(/\.md$/); })
    .map(function(n) { return path.join(PAGES_PATH, n); })
    .map(function(filePath) {
      return { path: filePath, page: fs.readFileSync(filePath, "utf8") };
    });
};

// puts k/v pair into shallow copied o
function assoc(o, k, v) {
  var c = {};
  for (var i in o) {
    c[i] = o[i];
  }

  c[k] = v;
  return c;
};

function checkPageLinks(pagesWithPaths) {
  var existantSlugHash = _
      .chain(pagesWithPaths)
      .pluck("path")
      .map(pathToSlug)
      .reduce(function(a, x) {
        a[x] = true;
        return a;
      }, {})
      .value();

  var brokenLinks = _
      .chain(pagesWithPaths)
      .map(function(pageWithPath) {
        return assoc(pageWithPath, "pageSlug", pathToSlug(pageWithPath.path));
      })
      .map(function(pageWithPageSlug) {
        return links(pageWithPageSlug.page)
          .map(function(link) { return { pageSlug: pageWithPageSlug.pageSlug, link: link }; });
      })
      .flatten()
      .filter(function(l) { return matchPageLink(l.link); })
      .map(function(l) { return assoc(l, "linkSlug", matchPageLink(l.link)[1]); })
      .filter(function(l) { return !(l.linkSlug in existantSlugHash); })
      .value();

  if (brokenLinks.length > 0) {
    throw new Error("Broken link(s) to: \n" +
                    brokenLinks
                      .map(function(l) { return "  " + l.linkSlug + " in " + l.pageSlug })
                      .join("\n"));
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

function linkIndices(page) {
  return matchIndices("\\[[^\\]]+\\]\\(#[^)]+\\)", page);
};

function matchPageLink(link) {
  return link.match(/\(#([^\)]+)\)$/);
};

function links(page) {
  return linkIndices(page)
    .map(function(range) { return page.slice(range[0], range[1]); });
};

function maybeMarkdownLinkToOnClick(link) {
  var pageMatch = matchPageLink(link);
  if (pageMatch) {
    var page = pageMatch[1];
    var text = link.match(/^\[([^\]]+)\]/)[1];
    return ['<a href="#" onclick="pub.loadHelpPage(event, \'', page, '\');">',
            text,
            "</a>"].join("");
  } else {
    return link;
  }
};

function makeLinksOnClick(md) {
  var linkTexts = links(md)
      .map(maybeMarkdownLinkToOnClick);

  var allIndices = [[undefined, 0]]
      .concat(linkIndices(md))
      .concat([[md.length]]);

  var nonLinkTexts = [];
  for (var i = 1; i < allIndices.length; i++) {
    nonLinkTexts.push(md.slice(allIndices[i - 1][1], allIndices[i][0]));
  }

  return _.compact(_.flatten(_.zip(nonLinkTexts, linkTexts))).join("");
};

buildPages();

// rebuild pages when something in on change
fs.watch(__dirname + "/../pages", function (event, filename) {
  if (filename.match(/\.md$/)) {
    buildPages();
  }
});
