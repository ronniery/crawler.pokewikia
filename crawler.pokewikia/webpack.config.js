const path = require('path')

module.exports = {
  entry: './react-app/index.js',
  output: {
    path: path.resolve(__dirname, './public/js'),
    filename: 'bundle.js'
  },
  watch: true,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
    ignored: /node_modules/
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};