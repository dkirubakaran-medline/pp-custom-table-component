module.exports = (config) => {
  // Add SCSS/SASS support
  config.module.rules.push({
    test: /\.s[ac]ss$/i,
    use: [
      // Creates `style` nodes from JS strings
      'style-loader',
      // Translates CSS into CommonJS
      'css-loader',
      // Compiles Sass to CSS using Dart Sass
      {
        loader: 'sass-loader',
        options: {
          implementation: require('sass'),
          sassOptions: {
            // Add any Sass options here
            outputStyle: 'compressed',
          },
        },
      },
    ],
  });

  return config;
};
