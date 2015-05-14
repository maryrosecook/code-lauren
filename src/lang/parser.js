var peg = require("pegjs");
var fs = require("fs");
var _ = require("underscore");
var util = require("../util");

var pegParse = peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                               { cache: true }).parse;

function parse(codeStr) {
  balanceParentheses(codeStr); // might throw

  try {
    return pegParse(codeStr);
  } catch(e) {
    throw new ParseError(e.line, e.column, e.message, e.stack);
  }
};

var parenthesisPairs = { "(": ")", "{": "}", ")": "(", "}": "{" };
var openParentheses = util.defaultObj(["(", "{"], true);
var closeParentheses = util.defaultObj([")", "}"], true);
function balanceParentheses(codeStr) {
  function createError(i, message) {
    throw new ParenthesisError(i, message);
  };

  function firstError(parenObj) {
    return Object.keys(parenObj)
      .reduce(function(a, p) {
        return a.concat(parenObj[p].map(function(i) { return { c: p, i: i } }));
      }, [])
      .sort(function(a, b) { return a.i - b.i; })[0];
  };

  var opens = util.defaultObj(Object.keys(openParentheses), Array);
  var orphanCloses = util.defaultObj(Object.keys(closeParentheses), Array);

  for (var i = 0; i < codeStr.length; i++) {
    var c = codeStr[i];
    if (c in openParentheses) {
      opens[c].push(i);
    } else if (c in closeParentheses) {
      var open = parenthesisPairs[c];
      if (opens[open].length > 0) {
        opens[open].pop();
      } else {
        orphanCloses[c].push(i);
      }
    }
  }

  var firstUnmatchedOpen = firstError(opens);
  var firstOrphanClose = firstError(orphanCloses);

  if (firstUnmatchedOpen !== undefined) {
    throw createError(firstUnmatchedOpen.i,
                      "Missing a closing " + parenthesisPairs[firstUnmatchedOpen.c]);
  } else if (firstOrphanClose !== undefined) {
    throw createError(firstOrphanClose.i,
                      "Missing a preceding opening " + parenthesisPairs[firstOrphanClose.c]);
  }
};

function indexToLineAndColumn(index, code) {
  var l = 1;
  var c = 1;
  for (var i = 0; i < index; i++) {
    if (code[i] === "\n") {
      l += 1;
      c = 1;
    } else {
      c += 1;
    }
  }

  return { line: l, column: c };
};

function ParseError(i, message, stack) {
  this.i = i;
  this.message = message;
  this.stack = stack;
};
ParseError.prototype = new Error();

function ParenthesisError(i, message, stack) {
  this.i = i;
  this.message = message;
  this.stack = stack;
};
ParenthesisError.prototype = new Error();

parse.indexToLineAndColumn = indexToLineAndColumn;
parse.ParseError = ParseError;
parse.ParenthesisError = ParenthesisError;
module.exports = parse;
