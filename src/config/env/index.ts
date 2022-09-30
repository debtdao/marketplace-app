import { memoize } from 'lodash';

import { Env, Network } from '@types';

export const getEnv = memoize((): Env => {
  const {
    NODE_ENV,
    REACT_APP_VERSION,
    REACT_APP_NETWORK,
    REACT_APP_CUSTOM_PROVIDER_HTTPS,
    REACT_APP_USE_MAINNET_FORK,
    REACT_APP_USE_SDK_MOCK,
    REACT_APP_ALLOW_DEV_MODE,
    REACT_APP_INFURA_PROJECT_ID,
    REACT_APP_ETHERSCAN_API_KEY,
    REACT_APP_ALCHEMY_API_KEY,
    REACT_APP_BLOCKNATIVE_KEY,
    REACT_APP_FORTMATIC_KEY,
    REACT_APP_PORTIS_KEY,
    REACT_APP_GRAPH_API_URL,
    REACT_APP_GRAPH_TEST_API_URL,
  } = process.env;

  return {
    ENV: NODE_ENV,
    VERSION: REACT_APP_VERSION ?? 'unknown',
    NETWORK: (REACT_APP_NETWORK ?? 'mainnet') as Network,
    CUSTOM_PROVIDER_HTTPS: REACT_APP_CUSTOM_PROVIDER_HTTPS ?? 'http://127.0.0.1:8545/',
    USE_MAINNET_FORK: REACT_APP_USE_MAINNET_FORK === 'true',
    USE_SDK_MOCK: REACT_APP_USE_SDK_MOCK === 'true',
    ALLOW_DEV_MODE: REACT_APP_ALLOW_DEV_MODE === 'true',
    INFURA_PROJECT_ID: REACT_APP_INFURA_PROJECT_ID,
    ETHERSCAN_API_KEY: REACT_APP_ETHERSCAN_API_KEY,
    ALCHEMY_API_KEY: REACT_APP_ALCHEMY_API_KEY,
    BLOCKNATIVE_KEY: REACT_APP_BLOCKNATIVE_KEY,
    FORTMATIC_KEY: REACT_APP_FORTMATIC_KEY,
    PORTIS_KEY: REACT_APP_PORTIS_KEY,
    GRAPH_API_URL: REACT_APP_GRAPH_API_URL,
    GRAPH_TEST_API_URL: REACT_APP_GRAPH_TEST_API_URL,
  };
});
