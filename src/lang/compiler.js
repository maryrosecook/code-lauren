var _ = require("underscore");

var util = require("../util");

function compileLiteral(a) {
  return [["push", a.c]];
};

function compileLabel(a) {
  return [["load_name", a.c]];
};

function compileUndefined() {
  return [["push", undefined]];
};

function compileTop(a) {
  return compile(a.c);
};

function compileDo(a) {
  var nonTerminalExpressions = a.c.slice(0, -1);
  var pops = _.range(nonTerminalExpressions.length)
      .map(function() { return ["pop"]; });
  var compiledReturnExpression = compile(a.c[a.c.length - 1]);

  return util.mapCat(nonTerminalExpressions, compile)
    .concat(pops)
    .concat(compiledReturnExpression);
};

function compileInvocation(a) {
  var compiledFn = compile(util.getNodeAt(a, ["invocation", 0]));
  return compiledFn.concat([["invoke"]]);
};

function compileLambdaDef(a) {
  return [["push", { bc: compile(util.getNodeAt(a, ["lambda", 1])), ast: a }]];
};

function compileReturn(a) {
  return compile(a.c).concat([["return"]]);
};

function compile(a) {
  if (a === undefined) {
    return compileUndefined();
  } else if (a.t === "top") {
    return compileTop(a);
  } else if (a.t === "do") {
    return compileDo(a);
  } else if (a.t === "lambda") {
    return compileLambdaDef(a);
  } else if (a.t === "invocation") {
    return compileInvocation(a);
  } else if (a.t === "return") {
    return compileReturn(a);
  } else if (a.t === "label") {
    return compileLabel(a);
  } else if (a.t === "number" || a.t === "string" || a.t === "boolean") {
    return compileLiteral(a);
  }
};

module.exports = compile;
