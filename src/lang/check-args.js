var langUtil = require("./lang-util");
var _ = require("underscore");

function checkBuiltinArgs(fnArgs) {
  var meta = fnArgs[0];
  var testArgs = _.toArray(fnArgs).slice(1);
  var specs = _.toArray(arguments).slice(1);
  specs.forEach(function(specOrSpecs, i) {
    var specOrSpecs = _.isArray(specOrSpecs) ? specOrSpecs : [specOrSpecs];

    specOrSpecs.forEach(function(spec) {
      if (i >= testArgs.length) {
        var markerIndex = meta.ast.s + meta.ast.text.trim().length - 1;
        throw new langUtil.RuntimeError("Needs " + spec.message,
                                        { s: markerIndex, e: markerIndex });
      } else if (testArgs[i] === undefined) {
        throw new langUtil.RuntimeError('This has no value',
                                        meta.ast.c[i + 1]);
      } else if (spec.testFn(testArgs[i])) {
        throw new langUtil.RuntimeError("Should be " + spec.message,
                                        meta.ast.c[i + 1]);
      }
    });
  });

  checkNoExtraArgs(meta.ast.c[0].c, testArgs, meta.ast.c.slice(1), specs.length);
};

function checkLambdaArgs(fnStackItem, argContainers, invocationAst) {
  var fn = fnStackItem.v;
  var parameters = fn.get("parameters");

  argContainers.forEach(function(c, i) {
    invocationAst.c.slice(1);
    if (c.v === undefined) {
      throw new langUtil.RuntimeError('This has no value', invocationAst.c.slice(1)[i]);
    }
  });

  if (parameters.length > argContainers.length) {
    var markerIndex = invocationAst.s + invocationAst.text.trim().length - 1;
    var firstMissingParameterIndex = argContainers.length;
    var firstMissingParameterName = parameters[firstMissingParameterIndex];
    throw new langUtil.RuntimeError('Missing a "' + firstMissingParameterName  + '"',
                                    { s: markerIndex, e: markerIndex });
  } else {
    checkNoExtraArgs(fnStackItem.ast.c,
                     argContainers.map(function(c) { return c.v; }),
                     argContainers.map(function(c) { return c.ast; }),
                     parameters.length);
  }
};

function checkNoExtraArgs(fnName, argValues, argAsts, parameterCount) {
  if (argValues.length > parameterCount) {
    var firstExtraArgumentIndex = parameterCount;
    var extraArgumentAsts = argAsts.slice(firstExtraArgumentIndex);
    var thisPluralised = extraArgumentAsts.length > 1 ? "these" : "this";
    var markerStartIndex = extraArgumentAsts[0].s;
    var markerEndIndex = _.last(extraArgumentAsts).e;
    throw new langUtil.RuntimeError('"' + fnName + '" ' + "does not need " + thisPluralised,
                                    { s: markerStartIndex, e: markerEndIndex });
  }
};

function createSpec(message, testFn) {
  return { message: message, testFn: testFn };
};

function defined(message) {
  return createSpec(message, function(arg) {
    return arg === undefined;
  });
};

function num(message) {
  return createSpec(message, function(arg) {
    return !_.isNumber(arg);
  });
};

function string(message) {
  return createSpec(message, function(arg) {
    return !_.isString(arg);
  });
};

function range(low, high, message) {
  low = low !== undefined ? low : Number.MIN_SAFE_INTEGER;
  high = high !== undefined ? high : Number.MAX_SAFE_INTEGER;
  return createSpec(message, function(arg) {
    return arg < low || arg > high;
  });
};

function numOrBoolean(message) {
  return createSpec(message, function(arg) {
    return !_.isNumber(arg) && !_.isBoolean(arg);
  });
};

function set(legalValues, message) {
  return createSpec(message, function(arg) {
    if (arg == null) {
      return true;
    } else if(_.isString(arg)) {
      return legalValues.indexOf(arg.toLowerCase()) === -1;
    } else {
      return legalValues.indexOf(arg) === -1;
    }
  });
};

function anyType(types, message) {
  return createSpec(message, function(arg) {
    for (var i = 0; i < types.length; i++) {
      if (arg.get("type") === types[i]) {
        return false;
      }
    }

    return true;
  });
};

// refactor to export the tests as well as the created specs

checkBuiltinArgs.defined = defined;
checkBuiltinArgs.num = num;
checkBuiltinArgs.string = string;
checkBuiltinArgs.set = set;
checkBuiltinArgs.range = range;
checkBuiltinArgs.numOrBoolean = numOrBoolean;
checkBuiltinArgs.anyType = anyType;
checkBuiltinArgs.checkLambdaArgs = checkLambdaArgs;
checkBuiltinArgs.checkBuiltinArgs = checkBuiltinArgs;
module.exports = checkBuiltinArgs;
