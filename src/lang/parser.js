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
    throw new ParseError([{ line: e.line, column: e.column, message: e.message }],
                         e.stack);
  }
};

var openParentheses = { "(": ")", "{": "}" };
var closeParentheses = { ")": "(", "}": "{" };
function balanceParentheses(codeStr) {
  function createError(i, message) {
    var error = indexToLineAndColumn(i, codeStr);
    error.message = message;
    throw new ParseError([error]);
  };

  var opens = [];
  var orphanCloses = [];

  for (var i = 0; i < codeStr.length; i++) {
    var c = codeStr[i];
    if (c in openParentheses) {
      opens.push({ c: c, i: i });
    } else if (c in closeParentheses) {
      var open = _.last(opens);
      if (open !== undefined && closeParentheses[c] === open.c) {
        opens.pop();
      } else {
        orphanCloses.push({ c: c, i: i });
      }
    }
  }

  if (opens.length > 0) {
    var p = _.last(opens);
    throw createError(p.i, "Missing a closing " + openParentheses[p.c]);
  } else if (orphanCloses.length > 0) {
    var p = orphanCloses[0];
    throw createError(p.i, "Missing a preceding opening " + closeParentheses[p.c]);
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

function ParseError(errors, stack) {
  this.errors = errors;
  this.stack = stack || new Error().stack;
};
ParseError.prototype = new Error();

parse.ParseError = ParseError;
module.exports = parse;
