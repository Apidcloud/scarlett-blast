const path = require('path');
const relativeBuildPath = 'build';
const relativeOutputPath = 'demo';
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  target: 'web',
  mode: 'production',
  devtool: ' ',
  entry: './demo/scarlett-game.js',
  output: {
    path: path.resolve(relativeBuildPath),
    publicPath: relativeOutputPath,
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]'
          } 
        }]
      }
    ]
  }
};
