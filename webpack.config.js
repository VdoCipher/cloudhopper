var webpack = require('webpack');

var config= {
  entry: './index.js',
  output: {
    path: __dirname + '/build',
    filename: 'cloudhopper.js',
	library: 'cloudhopper',
	libraryTarget: 'umd',
	umdNamedDefine: true
  },
  target: 'node',
	"externals" : [
		{
			"express" : "express",
			"body-parser" : "body-parser"
		}
	],
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ['es2015']
      }
    }]
  },
};

module.exports = config;
