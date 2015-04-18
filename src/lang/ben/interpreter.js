var im = require("immutable");
var peg = require("pegjs");
var fs = require("fs");
var _ = require("underscore");

var standardLibrary = require("./standard-library");

var pegParse = peg.buildParser(
  fs.readFileSync(__dirname + "/grammar.pegjs", "utf8")
).parse;

function parse(codeStr) {
  return pegParse("({" + codeStr + "})"); // wrap in invoked lambda
};

function Scope(scope, parent) {
  this.scope = scope;
  this.parent = parent;
};

Scope.prototype = {
  get: function(identifier) {
    if (identifier in this.scope) {
      return this.scope[identifier];
    } else if (this.parent !== undefined) {
      return this.parent.get(identifier);
    }
  },

  setBinding: function(k, v) {
    this.scope[k] = v;
  }
};

function createScope(scope, parent) {
  return new Scope(scope, parent);
};

// function* sExpressionList(ast, env) {
//   var exprs = [];
//   for (var i = 0; i < ast.c.length; i++) {
//     interpret(ast.c[i], env);
//   }
// };

function* interpretInvocation(ast, env) {
  var exprs = ast.c
      .map(function*(x) { yield* interpret(x, env); })
      .map(function(x) { return x.next().value; });
  yield* exprs[0].apply(null, exprs.slice(1));
};

function* interpretDo(ast, env) {
  var exprs = ast.c
      .map(function*(x) { yield* interpret(x, env); })
      .map(function(x) { return x.next().value; });
  yield _.last(exprs);
};

function interpretLambdaDef(ast, env) {
  return function* () {
    var lambdaArguments = arguments;
    var lambdaParameters = _.pluck(ast.c[0], "c");
    var lambdaScope = createScope(_.object(lambdaParameters, lambdaArguments), env);
    yield interpret(ast.c[1], lambdaScope);
  };
};

function* interpret(ast, env) {
  if (env === undefined) {
    yield interpret(ast, createScope(standardLibrary()));
  } else if (ast.t === "lambda") {
    yield interpretLambdaDef(ast, env);
  } else if (ast.t === "do") {
    yield interpretDo(ast, env);
  } else if (ast.t === "invocation") {
    yield interpretInvocation(ast, env);
  } else if (ast.t === "number" || ast.t === "string" || ast.t === "boolean" ) {
    yield ast.c;
  }
};

module.exports = {
  parse: parse,
  interpret: interpret,
  createScope: createScope
};
