const path = require('path');
const webpack = require('webpack');

const commonConfig = {
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
	})
    ],
    devtool: 'sourcemap'
};

module.exports = [
    Object.assign({}, commonConfig, {
	entry: {
	    popup: './src/popup.jsx'
	},
	plugins: commonConfig.plugins.concat([
	    new webpack.optimize.CommonsChunkPlugin("init.js")
	])
    }),
    Object.assign({}, commonConfig, {
	entry: {
	    background: './src/background.js'
	}
    })
];
