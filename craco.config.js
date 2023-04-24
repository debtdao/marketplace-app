const SriPlugin = require('webpack-subresource-integrity');
const CracoAlias = require('craco-alias');
require('react-scripts/config/env');

const REACT_APP = /^REACT_APP_/i;
const isProd = process.env.NODE_ENV === 'production';

// NOTE: orders REACT_APP_ environment variables in alphabetical order for consistent build bundle
const reactAppProcessEnv = Object.keys(process.env)
  .filter((key) => REACT_APP.test(key))
  .sort()
  .reduce((env, key) => {
    env[key] = process.env[key];
    return env;
  }, {});
Object.keys(reactAppProcessEnv).forEach((key) => {
  delete process.env[key];
  process.env[key] = reactAppProcessEnv[key];
});

module.exports = {
  babel: {
    plugins: [
      [
        'babel-plugin-styled-components',
        {
          minify: false,
          transpileTemplateLiterals: false,
        },
      ],
    ],
    // found on stack overflow as fix to metamask node module issue
    // rules: [{ test: /node_modules[\\/]@walletconnect/, loader: 'babel-loader' }],
    // https://github.com/babel/babel-loader#options
    // module: {
    //   rules: [{ test: /node_modules\/@walletconnect/, use: { loader: 'babel-loader' } }],
    //   // rules: [{ test: /@metamask/, use: { loader: 'babel-loader' } }],
    // },
  },
  webpack: {
    plugins: {
      add: [
        new SriPlugin({
          hashFuncNames: ['sha256', 'sha384'],
          enabled: isProd,
        }),
      ],
    },
    // found on stack overflow as fix to metamask node module issue
    // module: {
    //   exclude: /node_modules\/@[metamask|walletconnect]\/.*/,
    // },
    configure: (webpackConfig, { env, paths }) => {
      if (isProd) webpackConfig.output.crossOriginLoading = 'anonymous';
      return webpackConfig;
    },
  },
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: 'tsconfig',
        baseUrl: './src',
        tsConfigPath: './tsconfig.paths.json',
      },
    },
  ],
};
