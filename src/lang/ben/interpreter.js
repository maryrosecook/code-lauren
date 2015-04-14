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

function Continuation(fn) {
  this.fn = fn;
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

  var letScope = _.reduce(labels, function(s, l, i) {
    s.setBinding(l, interpret(values[i], s));
    return s;
  }, createScope({}, env));

  return interpret(ast.c[1], letScope);
};

function interpretIf(ast, env) {
  var parts = ast.c;
  return interpret(parts[0], env) ?
    interpret(parts[1], env) :
    interpret(parts[2], env);
};

function interpretInvocation(ast, env) {
  var exprs = ast.c.map(function(x) { return interpret(x, env); });
  return exprs[0].apply(null, exprs.slice(1));
};

function interpretDo(ast, env) {
  return new Continuation(function() {
    var exprs = ast.c.map(function(x) { return interpret(x, env); });
    return _.last(exprs);
  });
};

function interpretLiteral(ast, env) {
  return ast.c;
};

function interpret(ast, env) {
  if (ast === undefined) {
    return;
  } else if (env === undefined) {
    return interpret(ast, createScope(standardLibrary()));
  } else if (ast instanceof Continuation) {
    return ast.fn();
  } else if (ast.t === "invocation") {
    return interpretInvocation(ast, env);
  } else if (ast.t === "lambda") {
    return interpretLambdaDef(ast, env);
  } else if (ast.t === "let") {
    return interpretLet(ast, env);
  } else if (ast.t === "if") {
    return interpretIf(ast, env);
  } else if (ast.t === "do") {
    return interpretDo(ast, env);
  } else if (ast.t === "label") {
    return env.get(ast.c);
  } else if (ast.t === "number" || ast.t === "string" || ast.t === "boolean" ) {
    return interpretLiteral(ast, env);
  }
};

function run(str, env) {
  return interpret(parse(str), env);
};

run.parse = parse;
run.interpret = interpret;
run.createScope = createScope;
run.Continuation = Continuation;
module.exports = run;
