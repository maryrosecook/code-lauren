var peg = require("pegjs");
var fs = require("fs");
var _ = require("underscore");
var util = require("../util");

var pegParse = peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                               { cache: true }).parse;

function parseSyntax(codeStr) {
  try {
    return pegParse(codeStr);
  } catch(e) {
    throw new ParseError(e.offset, parseErrorToMessage(e, codeStr), e.stack);
  }
};

var parenthesisPairs = { "(": ")", "{": "}", ")": "(", "}": "{" };
var openParentheses = util.defaultObj(["(", "{"], true);
var closeParentheses = util.defaultObj([")", "}"], true);
function balanceParentheses(codeStr) {
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
    throw new ParenthesisError(firstUnmatchedOpen.i,
                               "Missing a closing " + parenthesisPairs[firstUnmatchedOpen.c]);
  } else if (firstOrphanClose !== undefined) {
    throw new ParenthesisError(firstOrphanClose.i,
                               "Missing a preceding opening " +
                               parenthesisPairs[firstOrphanClose.c]);
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

function rainbowParentheses(codeStr) {
  var pairs = [];
  var opens = util.defaultObj(Object.keys(openParentheses), Array);

  for (var i = 0; i < codeStr.length; i++) {
    var c = codeStr[i];
    if (c in openParentheses) {
      opens[c].push(i);
    } else if (c in closeParentheses) {
      var open = parenthesisPairs[c];
      if (opens[open].length > 0) {
        pairs.push([opens[open].pop(), i])
      }
    }
  }

  return pairs;
};

function parseErrorToMessage(e, code) {
  var expectations = _.chain(e.expected)
      .filter(function(p) { return getSyntaxFix(code, e.offset, p.value) !== undefined })
      .map(function(p) { return getSyntaxFix(code, e.offset, p.value); })
      .value();

  if (expectations.length > 0) {
    var descriptions = _.chain(expectations).where({ type: "description" }).pluck("value").value();
    var examples = _.chain(expectations).where({ type: "example" }).pluck("value").value();

    var str = "Expected this to be ";
    if (descriptions.length > 0) {
      str += commaSeparate(descriptions);
    }

    if (examples.length > 0) {
      if (descriptions.length > 0) {
        str += "or ";
      }

      str += "something like " + commaSeparate(examples);
    }

    return str;
  } else {
    return "This is not understandable here";
  }
};

var SYNTAX_FIXES = {
  "[ \\t\\r]": { str: " ", value: "a space", type: "description" },
  "[\\n]": { str: "\n", value: "a new line", type: "description" },
  "[0-9]": { str: "0", value: "231", type: "example" },
  '\"': { str: '\"', value: '"some words"', type: "example" },
  "true": { str: "true", value: "true", type: "example" },
  "[a-zA-Z0-9_\\-]": { str: "the-name-of-a-thing", value: "the-name-of-a-thing", type: "example" }
};

function getSyntaxFix(code, offset, parserSuggestion) {
  var fix = SYNTAX_FIXES[parserSuggestion];
  if (fix !== undefined) {
    try {
      var fixedCode = code.slice(0, offset - 1) + fix.str + code.slice(offset);
      pegParse(fixedCode);
      return fix;
    } catch (e) {
      return;
    }
  }
};

function commaSeparate(items) {
  if (items.length === 1) {
    return items[0];
  } else if (items.length > 1) {
    return items.slice(0, -1).join(", ") + " or " + _.last(items);
  }
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

parseSyntax.indexToLineAndColumn = indexToLineAndColumn;
parseSyntax.balanceParentheses = balanceParentheses;
parseSyntax.rainbowParentheses = rainbowParentheses;
parseSyntax.parseErrorToMessage = parseErrorToMessage;
parseSyntax.parseSyntax = parseSyntax;
parseSyntax.ParseError = ParseError;
parseSyntax.ParenthesisError = ParenthesisError;
module.exports = parseSyntax;
