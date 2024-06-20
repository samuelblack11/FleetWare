const webpack = require('webpack');

module.exports = {
  // Other webpack configurations...
  plugins: [
    new webpack.DefinePlugin({
      'process.env.GOOGLE_MAPS_API_KEY': JSON.stringify(process.env.GOOGLE_MAPS_API_KEY),
      'process.env.MAP_ID': JSON.stringify(process.env.MAP_ID),
    })
  ]
};
