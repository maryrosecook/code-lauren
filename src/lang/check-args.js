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
        throw new langUtil.RuntimeError("Needs " + spec.message,
                                        { s: meta.ast.e - 1, e: meta.ast.e - 1 });
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

  argContainers.forEach(function(c, i) {
    invocationAst.c.slice(1);
    if (c.v === undefined) {
      throw new langUtil.RuntimeError('This has no value', invocationAst.c.slice(1)[i]);
    }
  });

  if (fn.parameters.length > argContainers.length) {
    var markerIndex = invocationAst.e - 1;
    var firstMissingParameterIndex = argContainers.length;
    var firstMissingParameterName = fn.parameters[firstMissingParameterIndex];
    throw new langUtil.RuntimeError('Missing a "' + firstMissingParameterName  + '"',
                                    { s: markerIndex, e: markerIndex });
  } else {
    checkNoExtraArgs(fnStackItem.ast.c,
                     argContainers.map(function(c) { return c.v; }),
                     argContainers.map(function(c) { return c.ast; }),
                     fn.parameters.length);
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

function any(message) {
  return createSpec(message, function(arg) {
    return arg === undefined;
  });
};

function num(message) {
  return createSpec(message, function(arg) {
    return !_.isNumber(arg);
  });
};

function range(low, high, message) {
  low = low || Number.MIN_SAFE_INTEGER;
  high = high || Number.MAX_SAFE_INTEGER;
  return createSpec(message, function(arg) {
    return arg < low || arg > high;
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

checkBuiltinArgs.any = any;
checkBuiltinArgs.num = num;
checkBuiltinArgs.set = set;
checkBuiltinArgs.range = range;
checkBuiltinArgs.checkLambdaArgs = checkLambdaArgs;
checkBuiltinArgs.checkBuiltinArgs = checkBuiltinArgs;
module.exports = checkBuiltinArgs;
