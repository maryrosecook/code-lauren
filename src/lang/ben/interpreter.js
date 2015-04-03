var im = require("immutable");
var peg = require("pegjs");
var fs = require("fs");
var _ = require('underscore');

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

  this.get = function(identifier) {
    if (identifier in this.scope) {
      return this.scope[identifier];
    } else if (this.parent !== undefined) {
      return this.parent.get(identifier);
    }
  };
};

function createScope(scope, parent) {
  return new Scope(scope, parent);
};

function interpretLambdaDef(ast, env) {
  return function() {
    var lambdaArguments = arguments;
    var lambdaParameters = _.pluck(ast.c[0], "c");
    return interpret(ast.c[1],
                     createScope(_.object(lambdaParameters, lambdaArguments), env));
  };
};

function interpretLet(ast, env) {
  var labelValuePairs = _.flatten(_.pluck(ast.c[0].c, "c"));
  var labels = _.filter(_.pluck(labelValuePairs, "c"), function(_, i) { return i % 2 === 0; });
  var values = _.filter(labelValuePairs, function(_, i) { return i % 2 === 1; });

  var letEnv = _.reduce(labels, function(s, l, i) {
    var bindings = {};
    bindings[l] = interpret(values[i], s);
    return createScope(bindings, s);
  }, env);

  return interpret(ast.c[1], letEnv);
};

function interpretSExpression(ast, env) {
  var exprs = ast.c.map(function(x) { return interpret(x, env); });
  return exprs[0].apply(undefined, exprs.slice(1));
};

function interpretSExpressionList(ast, env) {
  return _.last(ast.c.map(function(x) { return interpret(x, env); }));
};

function interpretLiteral(ast, env) {
  return ast.c;
};

function interpret(ast, env) {
  if (env === undefined) {
    return interpret(ast, createScope(standardLibrary));
  } else if (ast.t === "invocation") {
    return interpretSExpression(ast, env);
  } else if (ast.t === "lambda") {
    return interpretLambdaDef(ast, env);
  } else if (ast.t === "let") {
    return interpretLet(ast, env);
  } else if (ast.t === "expression_list") {
    return interpretSExpressionList(ast, env);
  } else if (ast.t === "label") {
    return env.get(ast.c);
  } else { // literal
    return interpretLiteral(ast, env);
  }
};

function run(str, env) {
  return interpret(parse(str), env);
};

run.parse = parse;
run.interpret = interpret;
run.createScope = createScope;
module.exports = run;
