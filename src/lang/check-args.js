var langUtil = require("./lang-util");
var _ = require("underscore");

function checkBuiltinArgs(fnArgs) {
  var meta = fnArgs[0];
  var testArgs = _.rest(fnArgs);
  var specs = _.rest(arguments);
  specs.forEach(function(spec, i) { spec(meta, testArgs[i]); });
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

function color(message) {
  return createSpec(message, function(arg) {
    return arg == null || colors.indexOf(arg.toLowerCase()) === -1;
  });
};

checkBuiltinArgs.any = any;
checkBuiltinArgs.num = num;
checkBuiltinArgs.color = color;
checkBuiltinArgs.checkLambdaArity = checkLambdaArity;
checkBuiltinArgs.checkBuiltinNoExtraArgs = checkBuiltinNoExtraArgs;
checkBuiltinArgs.checkBuiltinArgs = checkBuiltinArgs;
module.exports = checkBuiltinArgs;

var colors = [
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blanchedalmond",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "green",
  "greenyellow",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "rebeccapurple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen"
];
