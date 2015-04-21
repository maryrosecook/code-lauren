var fs = require('fs');
var es6ify = require('es6ify');
var brfs = require('brfs');
var browserify = require('browserify');
var watchify = require('watchify');

var bundle = browserify({ debug: true, "insert-globals": true })
    .add(es6ify.runtime)
    .transform(es6ify.configure(/^(?!.*node_modules)+.+\.js$/))
    .transform(brfs)
    .require(require.resolve("./src/index.js"), { entry: true })

function build() {
  bundle
    .bundle()
    .pipe(fs.createWriteStream("./index.js"));

  console.log("Built.");
};

if (process.argv[2] === "watch") {
  console.log("Watching.");
  var watcher = watchify(bundle);
  watcher.on('update', build);
}

build();
