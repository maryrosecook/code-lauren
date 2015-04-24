module.exports = {
  entry: "./src/index.js",
  output: {
    path: __dirname,
    filename: "index.js"
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
      { test: /\.js$/, loader: "transform/cacheable?brfs" }
    ]
  },

  node: {
    fs: "empty"
  }
};
