const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
	popup: './src/popup.jsx',
	background: './src/background.js'
    },
    output: {
	path: 'extension/dist',
	filename: '[name].js'
    },
    module: {
	loaders: [{
	    exclude: /node_modules/,
	    test: /\.js[x]?$/,
	    loaders: ['babel']
	}]
    },
    resolve: {
	extensions: ['', '.js', '.jsx'],
	root: [
	    path.resolve(__dirname),
	],
	modulesDirectories: [
	    'src',
	    'node_modules',
	]
    },
    plugins: [
	new webpack.DefinePlugin({
	    'process.env.NODE_ENV': JSON.stringify('production')
	}),
	new webpack.optimize.CommonsChunkPlugin("init.js")
    ],
    devtool: 'sourcemap'
};
