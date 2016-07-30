var config = require("./webpack-base.config.js");
config.output.filename = "index.[chunkhash].js";
module.exports = config;
