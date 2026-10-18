const path = require('path');
const express = require('express');
const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const app = express();
const root = path.resolve(__dirname, '../..');
app.use(express.json({ limit: '100kb' }));
require('./pwa-api.cjs')(app);
const guestApi = require('./guest-api.cjs')(app);
const compiler = webpack({
  mode: 'development',
  context: root,
  entry: path.join(__dirname, 'index.js'),
  output: { path: path.join(root, 'build/payments'), filename: 'app.js', publicPath: '/' },
  devtool: 'cheap-module-source-map',
  module: { rules: [
    { test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { configFile: path.join(root, 'babel.config.js') } } },
    { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    { test: /\.(svg|png|jpe?g|webp|woff2?|ttf|eot)$/, use: { loader: 'url-loader', options: { limit: 8192, name: 'assets/[name].[hash:8].[ext]' } } },
  ] },
});
app.use(middleware(compiler, { publicPath: '/', stats: 'errors-only' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(3000, '0.0.0.0', () => {
  console.log('BOA Pay yönetim: http://127.0.0.1:3000');
  console.log('Masa QR kodları: http://127.0.0.1:3000/qr');
  console.log('Müşteri erişimi: ' + guestApi.publicBase + '/guest');
});
