var _ = require("underscore");

var util = require("../util");

function compileLiteral(a) {
  return [["push", a.c]];
};

function compileLabel(a) {
  return [["get_env", a.c]];
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
  var aInvocation = util.getNodeAt(a, ["invocation"]);
  var aArgs = aInvocation.slice(1);
  var compiledArgs = util.mapCat(aArgs, compile);
  var compiledFn = compile(aInvocation[0]);
  var code = compiledArgs.concat(compiledFn, [["invoke", aArgs.length]]);
  return code;
};

function compileConditional(a) {
  var parts = a.c;

  var clauses = []
  for (var i = 0; i < parts.length; i += 2) {
    clauses.push(
      compile(parts[i]).concat( // put conditional value to evaluate on stack
        [["if_not_true_jump", 3]], // skip block if !condition
        compile(parts[i + 1]), // push condition's lambda onto stack (skipped if !condition)
        [["invoke", 0]] // invoke the lambda (skipped if !condition)
      )
    );
  }

  var bc = [];
  for (var i = clauses.length - 1; i >= 0; i--) {
    bc.unshift(["jump", bc.length]);
    bc = clauses[i].concat(bc);
  };

  return bc;
};

function compileLambdaDef(a) {
  return [["push_lambda", {
    bc: compile(util.getNodeAt(a, ["lambda", 1])).concat([["pop_env_scope"]]),
    ast: a
  }]];
};

function compileReturn(a) {
  return compile(a.c).concat([["return"]]);
};

function compileAssignment(a) {
  return compile(a.c[1]).concat([["set_env", a.c[0].c],
                                 ["pop"]]);
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
  } else if (a.t === "assignment") {
    return compileAssignment(a);
  } else if (a.t === "conditional") {
    return compileConditional(a);
  } else if (a.t === "label") {
    return compileLabel(a);
  } else if (a.t === "number" || a.t === "string" || a.t === "boolean") {
    return compileLiteral(a);
  }
};

module.exports = compile;
