var peg = require("pegjs");
var fs = require("fs");
var _ = require("underscore");
var util = require("../util");

var standardLibrary = require("./standard-library");

var pegParse = peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                               { cache: true }).parse;

function parse(codeStr) {
  return pegParse(codeStr);
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

function Thunk(gFn) {
  this.g = gFn();
};

function createScope(scope, parent) {
  return new Scope(scope, parent);
};

function* listStar(gs) {
  var exprs = [];
  for (var i = 0; i < gs.length; i++) {
    var x = yield* trampoline(yield* gs[i]);
    exprs.push(x);
  }

  return exprs;
};

function* trampoline(v) {
  while(v instanceof Thunk) {
    v = yield* v.g;
  }

  return v;
};

function* interpretInvocation(ast, env) {
  var exprs = yield* listStar(ast.c.map(function(x) { return interpret(x, env); }));
  return new Thunk(function*() { return yield* exprs[0].apply(null, exprs.slice(1)) });
};

function* interpretDo(ast, env) {
  yield* listStar(_.initial(ast.c).map(function(x) { return interpret(x, env); }));
  return yield* interpret(_.last(ast.c), env);
};

function* interpretTop(ast, env) {
  return yield* trampoline(yield* interpret(ast.c, env));
};

function* interpretName(ast, env) {
  var labelValuePairs = _.flatten(_.pluck(ast.c[0].c, "c"));
  var labels = _.filter(_.pluck(labelValuePairs, "c"), function(_, i) { return i % 2 === 0; });
  var valueAsts = _.filter(labelValuePairs, function(_, i) { return i % 2 === 1; });

  var nameScope = createScope({}, env);
  for (var i = 0; i < labels.length; i++) {
    var v = yield* interpret(valueAsts[i], nameScope);
    nameScope.setBinding(labels[i], v);
  }

  return yield* interpret(ast.c[1], nameScope);
};

function* interpretIf(ast, env) {
  var parts = ast.c;
  return (yield* trampoline(yield* interpret(parts[0], env))) ?
    yield* interpret(parts[1], env) :
    yield* interpret(parts[2], env);
};

function interpretLambdaDef(ast, env) {
  return function* () {
    yield null; // allows the program to be stepped, rather than only invoked in one go

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
  } else if (ast.t === "top") {
    return yield* interpretTop(ast, env);
  } else if (ast.t === "lambda") {
    return interpretLambdaDef(ast, env);
  } else if (ast.t === "name") {
    return yield* interpretName(ast, env);
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
  createScope: createScope,
  trampoline: trampoline
};
