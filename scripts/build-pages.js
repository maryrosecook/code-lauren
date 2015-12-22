var fs = require("fs");
var path = require("path");
var _ = require("underscore");
var marked = require("marked");

var PAGES_PATH = __dirname + "/../pages";

var pageLinkRegex = /\(#([^\)]+)\)$/;

function buildPages() {
  try {
    var allPaths = markdownPaths(PAGES_PATH);

    var tutorialPagesWithPaths = _
        .chain(tutorialIndices(allPaths))
        .map(_.partial(tutorialPathPages, allPaths))
        .flatten()
        .value();

    var rootPagesWithPaths = _
        .difference(allPaths, _.pluck(tutorialPagesWithPaths, "path"))
        .map(pathToPathPage);

    var allPagesWithPaths = rootPagesWithPaths
        .concat(tutorialPagesWithPaths);

    checkPageLinks(allPagesWithPaths);

    var pages = allPagesWithPaths
        .map(function(pageWithPath) {
          return helpPage(pageWithPath.path,
                          marked(makeLinksOnClick(pageWithPath.page)),
                          pageWithPath.page);
        })
        .reduce(function(a, o) {
          if (o.slug in a) {
            throw new Error("Duplicated slug: " + o.slug);
          }

          a[o.slug] = { string: o.string, html: o.html, slug: o.slug };
          return a
      }, {});

    fs.writeFileSync(path.join(PAGES_PATH, "/all-pages.js"),
                     "module.exports = " + JSON.stringify(pages));
    console.log("Rebuilt");
  } catch (e) {
    console.log(e.stack)
    console.log("Rebuild failed:", e.message);
  }
};

function tutorialPathPages(allPages, indexPath) {
  function slugToPath(slug) {
    return contentPaths.filter(match(slug + "\.md$"))[0];
  };

  var toc = indexSlugs(indexPath);
  var prefix = tutorialPrefix(indexPath);
  var contentPaths = _.difference(allPages.filter(match("\/" + prefix + "[^\/]+\.md$")),
                                  [indexPath]);

  var tocWithIndex = [pathToSlug(indexPath)].concat(toc);
  var navLinkPairs = [];
  for (var i = 1; i < tocWithIndex.length; i++) {
    navLinkPairs.push([tocWithIndex[i - 1], tocWithIndex[i + 1]]);
  }

  if (navLinkPairs.length !== contentPaths.length) {
    throw new Error("Index doesn't match pages in " + prefix + " tutorial.");
  }

  return toc
    .map(slugToPath)
    .map(function(p, i) {
      var previous = navLinkPairs[i][0];
      var next = navLinkPairs[i][1];

      var nextPageTitle = next ?
          pageTitle(fs.readFileSync(slugToPath(next), "utf8")) :
          undefined;
      var markdownWithNav = addTutorialNavigation(fs.readFileSync(p, "utf8"),
                                                  previous,
                                                  next,
                                                  nextPageTitle);
      return createPathPage(p, markdownWithNav);
    })
    .concat(createPathPage(indexPath, fs.readFileSync(indexPath, "utf8")));
};

function addTutorialNavigation(markdown, previousSlug, nextSlug, nextTitle) {
  markdown += "\n ### ";

  if (previousSlug) {
    markdown += '[← Previous](#' + previousSlug + ') ';
  }

  if (nextSlug) {
    markdown += '<div class="next">[' + nextTitle + ' →](#' + nextSlug + ')</div>';
  }

  return markdown;
};

function pageTitle(markdown) {
  return markdown.match(/## (.+)/)[1];
};

function match(regex) {
  return function(str) {
    return str.match(regex);
  };
};

function indexSlugs(indexPath) {
  return fs
    .readFileSync(indexPath, "utf8")
    .match(/\n\n(1[\s\S]+)\n$/m)[1] // [\s\S] (class and opposite) mimics . that includes \n
    .split("\n")
    .map(function(line) { return line.replace("1. ", ""); })
    .map(function(line) { return line.match(pageLinkRegex)[1]; });
};

function tutorialPrefix(indexPath) {
  return indexPath.match(/\/([^\/]+-)index\.md$/)[1];
};

function tutorialIndices(allPaths) {
  return allPaths
    .filter(match(/index\.md$/));
};

function helpPage(path, html, page) {
  return { slug: pathToSlug(path), html: html, string: page };
};

function markdownPaths(p) {
  return fs
    .readdirSync(p)
    .map(function(n) { return path.join(p, n); })
    .filter(isFile)
    .filter(isMarkdown)
};

function pathToSlug(p) {
  return p.match(/^.+\/([A-Za-z0-9-]+)\.md$/)[1];
};

function isMarkdown(path) {
  return path.match(/\.md$/);
};

function isFile(path) {
  return fs.statSync(path).isFile();
};

function createPathPage(path, page) {
  return { path: path, page: page };
};

function pathToPathPage(filePath) {
  return createPathPage(filePath, fs.readFileSync(filePath, "utf8"));
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
      .filter(function(l) { return l.link.match(pageLinkRegex); })
      .map(function(l) { return assoc(l, "linkSlug", l.link.match(pageLinkRegex)[1]); })
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

function links(page) {
  return linkIndices(page)
    .map(function(range) { return page.slice(range[0], range[1]); });
};

function maybeMarkdownLinkToOnClick(link) {
  if (link.match(pageLinkRegex)) {
    var page = link.match(pageLinkRegex)[1];
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
  if (event == "change" && filename.match(/\.md$/)) {
    buildPages();
  }
});
