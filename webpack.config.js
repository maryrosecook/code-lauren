var path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.join(__dirname, "build"),
    filename: "index.js"
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
      { test: /\.js$/, loader: "transform/cacheable?brfs" },
      { test: /src\/top\.js$/, loader: "expose?top" },
      { test: /\.jsx$/, loader: "jsx-loader?insertPragma=React.DOM&harmony" },
      { test: /\.css$/, loader: "style-loader!css-loader" },
      { test: /\.(png|jpg)$/, loader: 'file-loader?name=img-[hash:6].[ext]' }
    ]
  },

  resolve: {
    extensions: ['', '.js', '.jsx']
  },

  node: {
    fs: "empty"
  }
};
