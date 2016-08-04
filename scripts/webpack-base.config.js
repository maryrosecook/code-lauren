var path = require("path");
var ManifestPlugin = require('webpack-manifest-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ProgressPlugin = require('webpack/lib/ProgressPlugin');
var lessVerboseWebpackProgressPlugin = require("./less-verbose-webpack-progress-plugin");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.join(__dirname, "../build")
  },

  watch: true,

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
      { test: /\.js$/, loader: "transform/cacheable?brfs" },
      { test: /src\/top\.js$/, loader: "expose?pub" },
      { test: /\.jsx$/, loader: "jsx-loader?insertPragma=React.DOM&harmony" },
      { test: /\.css$/, loader: "style-loader!css-loader" },
      { test: /\.json$/, loader: "json-loader" },
      { test: /\.(png|jpg|mp4)$/, loader: 'file-loader?name=[path][name].[ext]' },
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

  devtool: 'cheap-eval-source-map',

  plugins: [
    new ManifestPlugin(),
    new HtmlWebpackPlugin({
      template: "./src/index-template.html",
      inject: true
    }),
    lessVerboseWebpackProgressPlugin()
  ]
};
