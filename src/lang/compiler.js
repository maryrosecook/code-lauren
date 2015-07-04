var _ = require("underscore");

var util = require("../util");

var ANNOTATE = true;
var DO_NOT_ANNOTATE = false;

function compileLiteral(a) {
  return c(["push", a.c], a, ANNOTATE);
};

function compileLabel(a) {
  return c(["get_env", a.c], a, ANNOTATE);
};

function compileUndefined(a) {
  return c(["push", undefined], a, ANNOTATE);
};

function compileTop(a) {
  return compile(a.c);
};

function compileDo(a) {
  var nonTerminalExpressions = a.c.slice(0, -1);
  var pops = util.mapCat(nonTerminalExpressions,
                         function(e) { return c(["pop"], e); });
  var returnExpression = a.c[a.c.length - 1];
  var compiledReturnExpression = compile(returnExpression);

  return util.mapCat(nonTerminalExpressions, compile)
    .concat(pops)
    .concat(compiledReturnExpression);
};

function compileInvocation(a) {
  var aInvocation = util.getNodeAt(a, ["invocation"]);
  var aArgs = aInvocation.slice(1);
  var compiledArgs = util.mapCat(aArgs, compile);
  var compiledFn = compile(aInvocation[0]);
  var code = compiledArgs.concat(compiledFn, c(["invoke",
                                                aArgs.length,
                                                a.tail === true ? true : false],
                                               a,
                                               ANNOTATE));
  return code;
};

function compileConditional(a) {
  var parts = a.c;

  var clauses = [];
  for (var i = 0; i < parts.length; i += 2) {
    clauses.push(
      compile(parts[i]).concat( // put conditional value to evaluate on stack
        c(["if_not_true_jump", 3], parts[i]), // skip block if !condition
        compile(parts[i + 1]) // push condition's lambda inv onto stack (skipped if !condition)
      )
    );
  }

  var bc = [];
  for (var i = clauses.length - 1; i >= 0; i--) {
    var bcLength = bc.length
    bc = clauses[i].concat(c(["jump", bcLength], clauses[i]).concat(bc));
  };

  return bc;
};

function compileForever(a) {
  var invocation = compile(a.c);
  invocation[0].annotate = DO_NOT_ANNOTATE; // push_lambda
  invocation[1].annotate = DO_NOT_ANNOTATE; // invocation
  var bc = invocation.concat(c(["jump", -3], a));
  return bc;
};

function compileLambdaDef(a) {
  return c(["push_lambda", {
    bc: compile(util.getNodeAt(a, ["lambda", 1])),
    ast: a
  }], a, ANNOTATE);
};

function compileReturn(a) {
  return compile(a.c).concat(c(["return"], a));
};

function compileAssignment(a) {
  return compile(a.c[1]).concat(c(["set_env", a.c[0].c], a, ANNOTATE),
                                c(["pop"], a));
};

function c(c, ast, annotate) {
  c.ast = ast;
  c.annotate = (annotate === true ? true : false);
  return [c];
};

function compile(a) {
  if (a.t === "undefined") {
    return compileUndefined(a);
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
  } else if (a.t === "forever") {
    return compileForever(a);
  } else if (a.t === "label") {
    return compileLabel(a);
  } else if (a.t === "number" || a.t === "string" || a.t === "boolean") {
    return compileLiteral(a);
  }
};

compile.ANNOTATE = ANNOTATE;
compile.DO_NOT_ANNOTATE = DO_NOT_ANNOTATE;
module.exports = compile;
