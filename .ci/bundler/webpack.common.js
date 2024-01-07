const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: './ts/client/client.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: {
      three: path.resolve('./node_modules/three'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '../../dist/client'),
  },
  plugins:
    [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../../ts/wasm/CodeCraftedGeometryWasm.wasm'),
                    to: path.resolve(__dirname, '../../dist/client'),
                },
            ]
        })
    ]
};
