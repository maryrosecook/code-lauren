var fs = require("fs");
var path = require("path");

var config = require("./webpack-base.config.js");
config.output.filename = "index.[chunkhash].js";
module.exports = config;
