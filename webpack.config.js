let webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const AddLicenseTextPlugin = require('./plugins/add-license-text');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  let mode_env = argv.mode || 'development';

  return {
    devtool: 'source-map',
    entry: {
      main: './packed/lib/src/index',
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            sourceMap: true,
          },
          parallel: true,
          test: /\.js(\?.*)?$/i,    
          extractComments: true     
        }),
      ],
    },
    output: {
      library: 'dynamic-redux-modules',
      libraryTarget: 'umd',
      filename: process.env.NODE_ENV === 'production' ? 'dynamic-redux-modules.min.js' : 'dynamic-redux-modules.js',
      path: __dirname + '/packed/dist/',
    },

    externals: {
      'prop-types': 'prop-types',
      react: 'react',
      redux: 'redux',
      'react-redux': 'react-redux',
      'redux-saga': 'redux-saga',
    },    
    plugins: [
      new AddLicenseTextPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: 'package.json',            
            to: '../'
          },
          {
            from: 'README.md',            
            to: '../'
          }
        ]
      })
    ]
  };
};
