var _ = require("underscore");

var util = require("../util");

var ANNOTATE = true;
var DO_NOT_ANNOTATE = false;

function compileLiteral(a) {
  return ins(["push", a.c], a, ANNOTATE);
};

function compileLabel(a) {
  return ins(["get_env", a.c], a, ANNOTATE);
};

function compileUndefined(a) {
  return ins(["push", undefined], a, ANNOTATE);
};

function compileTop(a) {
  return compile(a.c);
};

function compileDo(a) {
  var nonTerminalExpressions = a.c.slice(0, -1);
  var pops = util.mapCat(nonTerminalExpressions,
                         function(e) { return ins(["pop"], e); });
  var returnExpression = a.c[a.c.length - 1];
  var compiledReturnExpression = compile(returnExpression);

  return util.mapCat(nonTerminalExpressions, compile)
    .concat(pops)
    .concat(compiledReturnExpression);
};

function compileInvocation(a) {
  var aInvocation = util.getNodeAt(a, ["invocation"]);
  var aArgs = aInvocation.slice(1);
  var compiledArgs = ins(["arg_start"]).concat(util.mapCat(aArgs, compile));
  var compiledFn = compile(aInvocation[0]);
  var tail = a.tail === true ? true : false;
  var code = compiledArgs.concat(compiledFn,
                                 ins(["invoke", aArgs.length, tail],
                                     a,
                                     ANNOTATE));
  return code;
};

function compileElse(a) {
  return ins(["push", true], a, ANNOTATE);
};

function compileConditional(a) {
  var parts = a.c;

  var clauses = [];
  for (var i = 0; i < parts.length; i += 2) {
    var conditionalBc = compile(parts[i]);
    var bodyBc = compile(parts[i + 1]); // will push condition's lambda inv onto stack
    bodyBc[1].annotate = DO_NOT_ANNOTATE; // push lambda
    bodyBc[2].annotate = DO_NOT_ANNOTATE; // invoke lambda

    clauses.push(
      conditionalBc.concat( // put conditional value to evaluate on stack
        ins(["if_not_true_jump", 4], parts[i]), // skip block if !condition
        bodyBc // (skipped if !condition)
      )
    );
  }

  // add final else clause that will run if none of user's clauses
  // run.  Will push undefined onto stack to be the return value of
  // the whole conditional.
  clauses.push(ins(["push", undefined], a));

  // add jumps that, if a block is chosen and evaluated, will jump
  // to the end of the conditional
  var bc = [];
  for (var i = clauses.length - 1; i >= 0; i--) {
    var bcLength = bc.length
    bc = clauses[i].concat(ins(["jump", bcLength], parts[i]).concat(bc));
  };

  return bc;
};

function compileForever(a) {
  var invocation = compile(a.c);

  // doctor push_lambda so can annotate on forever keyword
  invocation[1].ast = {
    warning: "push_lambda ast faked to forever keyword for annotation",
    t: "forever",
    s: a.s,
    e: a.s + "forever".length,
    text: "forever"
  };

  invocation[1].isForever = true; // annotate so can rAF on each forever for rate limiting

  invocation[2].annotate = DO_NOT_ANNOTATE; // invocation

  var bc = invocation.concat(ins(["pop"]),
                             ins(["jump", -4], a));
  return bc;
};

function compileLambdaDef(a) {
  return ins(["push_lambda", createLambda(compile(util.getNodeAt(a, ["lambda", 1])),
                                          _.pluck(a.c[0], "c"))],
             a,
             ANNOTATE);
};

function compileReturn(a) {
  return compile(a.c).concat(ins(["return"], a));
};

function compileAssignment(a) {
  return compile(a.c[1]).concat(ins(["set_env", a.c[0].c], a, ANNOTATE),
                                ins(["pop"], a));
};

function ins(instruction, ast, annotate) {
  instruction.ast = ast;
  instruction.annotate = (annotate === true ? true : false);
  return [instruction];
};

function createLambda(bc, parameters) {
  return { bc: bc, parameters: parameters };
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
  } else if (a.t === "else") {
    return compileElse(a);
  } else if (a.t === "number" || a.t === "string" || a.t === "boolean") {
    return compileLiteral(a);
  }
};

compile.ANNOTATE = ANNOTATE;
compile.DO_NOT_ANNOTATE = DO_NOT_ANNOTATE;
compile.createInstruction = ins;
module.exports = compile;
