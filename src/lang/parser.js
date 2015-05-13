var peg = require("pegjs");
var fs = require("fs");
var _ = require("underscore");
var util = require("../util");

var pegParse = peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                               { cache: true }).parse;

function parse(codeStr) {
  try {
    return pegParse(codeStr);
  } catch(e) {
    throw util.copyException(e, new ParseError());
  }
};

function ParseError(e) {};
ParseError.prototype = new Error();

parse.ParseError = ParseError;
module.exports = parse;
