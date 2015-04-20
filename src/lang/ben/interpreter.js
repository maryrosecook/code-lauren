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

  // for (var i = 0; i < gs.length; i++) {
  //   var prev;
  //   while (true) {
  //     var next = gs[i].next();
  //     if (next.done === true) {
  //       break;
  //     }

  //     prev = next;
  //   }

  //   exprs.push(prev.value);
  // }

function* listStar(gs) {
  var exprs = [];
  for (var i = 0; i < gs.length; i++) {
    var x = yield* gs[i];
    exprs.push(x);
  }

  return exprs;
}

function* interpretInvocation(ast, env) {
  yield null;
  var exprs = yield* listStar(ast.c.map(function(x) { return interpret(x, env); }));
  return yield* exprs[0].apply(null, exprs.slice(1));
};

function* interpretDo(ast, env) {
  var exprs = yield* listStar(ast.c.map(function(x) { return interpret(x, env); }));
  return _.last(exprs);
};

function* interpretLet(ast, env) {
  var labelValuePairs = _.flatten(_.pluck(ast.c[0].c, "c"));
  var labels = _.filter(_.pluck(labelValuePairs, "c"), function(_, i) { return i % 2 === 0; });
  var valueAsts = _.filter(labelValuePairs, function(_, i) { return i % 2 === 1; });

  var letScope = createScope({}, env);
  for (var i = 0; i < labels.length; i++) {
    var v = yield* interpret(valueAsts[i], letScope);
    letScope.setBinding(labels[i], v);
  }

  return yield* interpret(ast.c[1], letScope);
};

function* interpretIf(ast, env) {
  var parts = ast.c;
  return (yield* interpret(parts[0], env)) ?
    yield* interpret(parts[1], env) :
    yield* interpret(parts[2], env);
};

function interpretLambdaDef(ast, env) {
  return function* () {
    var lambdaArguments = arguments;
    var lambdaParameters = _.pluck(ast.c[0], "c");
    var lambdaScope = createScope(_.object(lambdaParameters, lambdaArguments), env);
    return yield* interpret(ast.c[1], lambdaScope);
  };
};

function* interpret(ast, env) {
  if (ast === undefined) {
    return;
  } else if (env === undefined) {
    return yield* interpret(ast, createScope(standardLibrary()));
  } else if (ast.t === "lambda") {
    return interpretLambdaDef(ast, env);
  } else if (ast.t === "let") {
    return yield* interpretLet(ast, env);
  } else if (ast.t === "if") {
    return yield* interpretIf(ast, env);
  } else if (ast.t === "do") {
    return yield* interpretDo(ast, env);
  } else if (ast.t === "invocation") {
    return yield* interpretInvocation(ast, env);
  } else if (ast.t === "label") {
    return env.get(ast.c);
  } else if (ast.t === "number" || ast.t === "string" || ast.t === "boolean" ) {
    return ast.c;
  }
};

module.exports = {
  parse: parse,
  interpret: interpret,
  createScope: createScope
};
