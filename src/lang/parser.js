var peg = require("pegjs");
var fs = require("fs");
var _ = require("underscore");
var util = require("../util");

function buildParser(options) {
  return peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                                 options).parse;
};

function parseSyntax(codeStr) {
  try {
    return buildParser({ cache: true })(codeStr);
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
  var tracer = createLastRuleTracer();

  try { buildParser({ cache: true, trace: true })(code); }
  catch (e) {}

  // var indent = 0;
  // for (var i = 0; i < tracer.events.length; i++) {
  //   var ev = tracer.events[i];
  //   if (ev.type === "rule.enter") {
  //     indent += 1;
  //   } else if (ev.type === "rule.fail") {
  //     indent -= 1;
  //   }

  //   console.log(Array(indent).join(" ") + ev.rule);
  // }


  // if (expectations.length > 0) {
  //   return "Expected this to be " + commaSeparate(expectations);
  // } else {
  //   return "This is not understandable here";
  // }
};

function createLastRuleTracer() {
  return {
    events: [],
    trace: function(event) {
      this.events.push(event);
    }
  };
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
