module.exports = {
  entry: "./src/js/app.js",
  mode: "development",
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.svg/,
        use: {
          loader: "svg-url-loader",
          options: {}
        }
      },
      {
        test: /\.png/,
        use: {
          loader: "url-loader",
          options: { limit: 8192 }
        }
      }
    ]
  }
};
