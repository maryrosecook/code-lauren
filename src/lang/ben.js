var im = require("immutable");
var peg = require("pegjs");
var fs = require("fs");

var pegParse = peg.buildParser(
  fs.readFileSync(__dirname + "/ben.pegjs", "utf8")
).parse;

function parse(str) {
  return pegParse(str);
};

function interpret(ast) {

};

function run(str) {
  return interpret(parse(str));
};

run.parse = parse;
run.interpret = interpret;
module.exports = run;
