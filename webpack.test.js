const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const path = require('path')

const js = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['react', 'es2015'],
      plugins: ['transform-class-properties']
    }
  }
}

module.exports = {
  mode: 'development',
  target: 'node',
  node: {
    __dirname: false
  },
  externals: [nodeExternals()],
  entry: {
    'app.spec.js': path.resolve(__dirname, 'specs/app.spec.js')
  },
  module: {
    rules: [js]
  },
  output: {
    path: path.resolve(__dirname, 'test'),
    filename: '[name]'
  }
}
