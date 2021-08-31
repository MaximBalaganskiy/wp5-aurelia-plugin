/* eslint-disable no-undef */
/* eslint-disable import/no-nodejs-modules */
const path = require('path');
const { NormalModuleReplacementPlugin, ProvidePlugin } = require('webpack');
// const FileSystemInfo = require('webpack/lib/FileSystemInfo');
const { AureliaPlugin } = require('aurelia-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// override to enable '@aurelia-mdc-web' HMR
// const FileSystemInfoFix = require('./FileSystemInfo');
// FileSystemInfo.prototype.createSnapshot = FileSystemInfoFix.prototype.createSnapshot;

module.exports = (env, { mode, analyze } = {}) => {
  const production = mode === 'production';
  const cssLoaders = [{ loader: 'css-loader', options: { esModule: false } }];
  // const scssLoaders = [...cssLoaders, {
  //   loader: 'sass-loader', options: {
  //     sourceMap: false,
  //     implementation: require('sass'),
  //     sassOptions: {
  //       includePaths: [path.resolve('../../node_modules/'), path.resolve('./node_modules')]
  //     }
  //   }
  // }];

  return [{
    target: 'web',
    mode: production ? 'production' : 'development',
    devtool: production ? 'source-map' : 'eval-source-map',
    entry: { app: 'aurelia-bootstrapper' },
    devServer: {
      hot: true,
      port: 8080,
      // https: {
      //   key: './server.key',
      //   cert: './server.crt'
      // }
    },
    resolve: {
      extensions: ['.ts', '.js'],
      modules: ['src', 'local_modules', 'node_modules', '../../node_modules'].map(x => path.resolve(x)),
      alias: {
        '@aquantify/common': path.resolve(__dirname, `../common/${production ? 'dist' : 'dist'}`)
      }
    },
    output: {
      path: path.resolve('dist'),
      filename: '[name].[fullhash].js',
      chunkFilename: '[name].[chunkhash].js',
      pathinfo: false
    },
    module: {
      rules: [
        { test: /\.(woff|woff2)(\?|$)/, use: { loader: 'url-loader', options: { limit: 1, esModule: false } } },
        { test: /\.(png|eot|ttf|svg)(\?|$)/, use: { loader: 'url-loader', options: { limit: 1000, esModule: false } } },
        { test: /\.js$/, enforce: 'pre', use: ['source-map-loader'], include: [/@aurelia-mdc-web/, /@aurelia-toolkit/] },
        { test: /\.ts$/i, include: [/src/], use: [{ loader: 'ts-loader' }] },
        { test: /\.html$/i, use: { loader: 'html-loader', options: { esModule: false, sources: { list: [{ tag: 'img', attribute: 'src', type: 'src' }, { tag: 'app-nav-bar', attribute: 'logo-url', type: 'src' }] } } } },
        // { test: /\.scss$/i, issuer: /\.html$/i, use: scssLoaders },
        // { test: /\.scss$/i, issuer: [{ not: /\.html$/i }], exclude: [/root-progress\.scss$/], use: ['style-loader', ...scssLoaders] },
        // { test: /root-progress\.scss$/, issuer: [{ not: /\.html$/i }], use: [{ loader: MiniCssExtractPlugin.loader }, ...scssLoaders] },
        { test: /\.css$/i, issuer: [{ not: /\.html$/i }], use: ['style-loader', ...cssLoaders] },
        { test: /\.css$/i, issuer: /\.html$/i, use: cssLoaders }
      ]
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        // uncomment the following to create a separate bundle for each npm module
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          common: {
            test: /[\\/]common[\\/]dist[\\/]/,
            name: 'aquantify-ui-common'
          },
          materialcss: {
            test: /root\.scss$/
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // get the name. E.g. node_modules/packageName/not/this/part.js
              // or node_modules/packageName
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

              // npm package names are URL-safe, but some servers don't like @ symbols
              return `npm.${packageName.replace('@', '').replace('google-analytics', 'gan')}`;
            }
          },
          // expressionDialog: {
          //   test: /expression-dialog/,
          //   name: 'expression-dialog',
          //   chunks: 'async'
          // }
        }
      }
    },
    performance: {
      hints: false
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'index.ejs',
        metadata: {
          // available in index.ejs //
          // baseUrl
        }
      }),
      // new HtmlWebpackPlugin({ template: 'old_browser.ejs', filename: 'old_browser.html', inject: false, alwaysWriteToDisk: true }),
      new AureliaPlugin({ aureliaApp: 'main' }),
      // new MiniCssExtractPlugin({
      //   filename: '[name].[fullhash].css',
      //   chunkFilename: '[name].[chunkhash].css'
      // }),
      new NormalModuleReplacementPlugin(/environments\/environment/gi, `environments/${production ? 'production' : 'environment'}`),
      // new ProvidePlugin({ '$': 'jquery', 'jQuery': 'jquery', 'window.jQuery': 'jquery', 'window.$': 'jquery' }),
      ...(analyze ? [new BundleAnalyzerPlugin()] : [])
    ]
  }];
};
