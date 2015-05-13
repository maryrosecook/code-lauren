var peg = require("pegjs");
var fs = require("fs");

var pegParse = peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                               { cache: true }).parse;

function parse(codeStr) {
  return pegParse(codeStr);
};

module.exports = parse;
