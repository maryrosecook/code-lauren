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
      { test: /src\/top\.js$/, loader: "expose?pub" },
      { test: /\.jsx$/, loader: "jsx-loader?insertPragma=React.DOM&harmony" },
      { test: /\.css$/, loader: "style-loader!css-loader" },
      { test: /\.json$/, loader: "json-loader" },
      { test: /\.(png|jpg)$/, loader: 'file-loader?name=img-[hash:6].[ext]' },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&minetype=application/font-woff" },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" }
    ]
  },

  resolve: {
    extensions: ['', '.js', '.jsx']
  },

  node: {
    fs: "empty"
  },

  devtool: 'source-map'
};
