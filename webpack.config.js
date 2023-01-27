const path = require('path'); // eslint-disable-line @typescript-eslint/no-var-requires
const CopyPlugin = require("copy-webpack-plugin");

const distDir = path.resolve(__dirname, './dist');

module.exports = {
  entry: path.resolve(__dirname, './src/index.ts'),
  mode: 'development',
  target: 'node',
  devtool: 'inline-source-map',
  output: {
    filename: 'index.js',
    path: distDir
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }], 
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  plugins: [
    // Copy useful files to dist so we can publish from that directly
    // ...makes library imports a little cleaner by removing sub-dir
    new CopyPlugin({
      patterns: [
        { from: 'package.json', to: distDir },
        { from: 'README.md', to: distDir },
      ],
    }),
  ],
};
