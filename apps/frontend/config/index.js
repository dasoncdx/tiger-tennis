const path = require('path')

const isProduction = process.env.NODE_ENV === 'production'

const config = {
  projectName: 'frontend',
  date: '2025-06-10',
  designWidth: 375,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {
    'process.env.TARO_APP_API_URL': JSON.stringify(
      isProduction
        ? 'https://tiger-tennis.zeabur.app'
        : 'http://localhost:3001'
    ),
  },
  copy: {
    patterns: [
      { from: 'static/index.html', to: 'dist/index.html' },
      { from: 'static/Caddyfile', to: 'dist/Caddyfile' },
    ],
    options: {},
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: { enable: false },
  mini: {},
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    esnextModules: ['nutui-react-taro', '@nutui'],
    postcss: {
      autoprefixer: { enable: true, config: {} },
      cssModules: { enable: false },
    },
    devServer: {
      port: 10086,
      proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
    },
  },
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}

