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
    filename: 'bundle.min.js'
  },
  optimization: {
    minimize: false
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
  },
  plugins: [
    new UglifyJSPlugin({
      uglifyOptions: {
        warning: "verbose",
        ecma: 6,
        beautify: false,
        compress: false,
        comments: false,
        mangle: false,
        toplevel: false,
        keep_classnames: true,
        keep_fnames: true
      }
    })
  ]
};
