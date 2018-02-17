const path = require('path');
const relativeBuildPath = 'build';
const relativeOutputPath = 'demo';

module.exports = {
  mode: "development",
  devtool: 'source-map',
  entry: './demo/scarlett-game.js',
  output: {
    path: path.resolve(relativeBuildPath),
    publicPath: relativeOutputPath,
    filename: 'bundle.js'
  }
};
