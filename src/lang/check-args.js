var langUtil = require("./lang-util");
var _ = require("underscore");

function checkBuiltinArgs(fnArgs) {
  var meta = fnArgs[0];
  var testArgs = _.rest(fnArgs);
  var specs = _.rest(arguments);
  specs.forEach(function(specOrSpecs, i) {
    if (_.isArray(specOrSpecs)) {
      specOrSpecs.forEach(function(spec) { spec(meta, testArgs[i]); });
    } else {
      specOrSpecs(meta, testArgs[i]);
    }
  });
};

function checkLambdaArity(fnStackItem, argContainers, invocationAst) {
  var fn = fnStackItem.v;

  if (fn.parameters.length > argContainers.length) {
    var markerIndex = invocationAst.e - 1;
    var firstMissingParameterIndex = argContainers.length;
    var firstMissingParameterName = fn.parameters[firstMissingParameterIndex];
    throw new langUtil.RuntimeError('Missing a "' + firstMissingParameterName  + '"',
                                    { s: markerIndex, e: markerIndex });
  } else if (fn.parameters.length < argContainers.length) {
    checkNoExtraArgs(fnStackItem, argContainers, fn.parameters.length);
  }
};

function checkBuiltinNoExtraArgs(fnStackItem, argContainers, fnParameterCount) {
  checkNoExtraArgs(fnStackItem, argContainers, fnParameterCount - 1);
};

function checkNoExtraArgs(fnStackItem, argContainers, parameterCount) {
  if (argContainers.length > parameterCount) {
    var fnName = fnStackItem.ast.c;
    var firstExtraArgumentIndex = parameterCount;
    var extraArgumentAsts = argContainers.slice(firstExtraArgumentIndex);
    var thisPluralised = extraArgumentAsts.length > 1 ? "these" : "this";
    var markerStartIndex = extraArgumentAsts[0].ast.s;
    var markerEndIndex = _.last(extraArgumentAsts).ast.e;

    throw new langUtil.RuntimeError('"' + fnName + '" ' + "does not need " + thisPluralised,
                                    { s: markerStartIndex, e: markerEndIndex });
  }
};

function createSpec(message, testFn) {
  return function(meta, arg) {
    if (testFn(arg)) {
      var markerIndex = meta.ast.e - 1;
      throw new langUtil.RuntimeError(message, { s: markerIndex, e: markerIndex });
    }
  };
};

function any(message) {
  return createSpec(message, function(arg) {
    return arg === undefined;
  });
};

function num(message) {
  return createSpec(message, function(arg) {
    return isNaN(parseFloat(arg));
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
checkBuiltinArgs.checkLambdaArity = checkLambdaArity;
checkBuiltinArgs.checkBuiltinNoExtraArgs = checkBuiltinNoExtraArgs;
checkBuiltinArgs.checkBuiltinArgs = checkBuiltinArgs;
module.exports = checkBuiltinArgs;
