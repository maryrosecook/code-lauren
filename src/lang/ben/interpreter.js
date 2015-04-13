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

function interpretSExpressionList(ast, env) {
  for (var i = 0; i < ast.c.length; i++) {
    if (ast.c[i].t !== undefined) {
      ast.c[i] = interpret(ast.c[i], env);
      if (i > 0 && ast.c[i] instanceof Function) {
        return function() {
          return interpret(ast, env);
        };
      }
    }
  }

  return ast;
};

function interpretInvocation(ast, env) {
  var next = interpretSExpressionList(ast, env);
  return next instanceof Function ?
    next :
    ast.c[0].apply(null, ast.c.slice(1));
};

function interpretDo(ast, env) {
  var next = interpretSExpressionList(ast, env);
  return next instanceof Function ?
    next :
    _.last(next.c);
};

function interpretLiteral(ast, env) {
  return ast.c;
};

function interpret(ast, env) {
  if (ast instanceof Function) {
    return ast();
  } else if (env === undefined) {
    return interpret(ast, createScope(standardLibrary()));
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
