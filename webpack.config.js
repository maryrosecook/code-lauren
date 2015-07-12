module.exports = {
  entry: "./src/index.js",
  output: {
    path: __dirname,
    filename: "index.js"
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
      { test: /\.js$/, loader: "transform/cacheable?brfs" },
      { test: /src\/sidebar\.jsx$/, loader: "expose?sidebar" },
      { test: /\.jsx$/, loader: "jsx-loader?insertPragma=React.DOM&harmony" }
    ]
  },

  resolve: {
    extensions: ['', '.js', '.jsx']
  },

  node: {
    fs: "empty"
  }
};
