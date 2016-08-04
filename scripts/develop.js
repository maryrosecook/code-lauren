var rimraf = require("rimraf");
var path = require("path");
var webpack = require("webpack");
var rebuildPagesOnChange = require("./build-pages");

var BUILD_DIRECTORY_PATH = path.join(__dirname, "../build");

function removeOldBuildFiles() {
  rimraf.sync(path.join(BUILD_DIRECTORY_PATH, "/*"));
};

function getWebpackConfig() {
  var config = require("./webpack-base.config.js");
  config.output.filename = "index.js";
  return config;
};

function startLiveServer() {
  var liveServer = require("live-server");

  var params = {
    port: 4000, // Set the server port. Defaults to 8080.
    host: "localhost", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
    root: BUILD_DIRECTORY_PATH, // Set root directory that's being server. Defaults to cwd.
    open: false // When false, it won't load your browser by default.
  };

  console.log("-----------------------");
  liveServer.start(params);
};

function rebuildSourceOnChange() {
  webpack(getWebpackConfig(), function() {
    console.log("-----------------------");
    console.log("Built source");
  });
}

function run() {
  removeOldBuildFiles();
  startLiveServer();
  rebuildSourceOnChange();
  rebuildPagesOnChange();
};

run();
