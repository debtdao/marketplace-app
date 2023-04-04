import { memoize } from 'lodash';

import { Constants, NetworkSettings, TokenView } from '@types';
import { getEnv } from '@config/env';

import { networks } from './supportedNetworks.json';
import { CHAIN_IDS, CHAIN_NAMES } from './chainIds';

// import { encode } from '@src/utils';

export const TOKEN_ADDRESSES = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  // AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  // YFI: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  // SUSD: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
  LUSD: '0x5f98805a4e8be255a32880fdec7f6728c6568ba0',
  ALUSD: '0xbc6da0fe9ad5f3b0d58160288917aa56653660e9',
  // RAI: '0x03ab458634910aad20ef5f1c8ee96f1d6ac54919',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
};

const PARTNERS = {
  LEDGER_PARTNER_ID: '0x558247e365be655f9144e1a0140D793984372Ef3',
};

const NETWORK_SETTINGS: NetworkSettings = {
  mainnet: {
    id: 'mainnet',
    name: 'Ethereum',
    networkId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    simulationsEnabled: true,
    earningsEnabled: true,
    notifyEnabled: true,
    blockExplorerUrl: 'https://etherscan.io',
    txConfirmations: 2,
  },
  gnosis: {
    id: 'gnosis',
    name: 'Gnosis',
    networkId: 100,
    rpcUrl: 'https://rpc.gnosis.gateway.fm',
    nativeCurrency: {
      name: 'xDA(',
      symbol: 'xDAI',
      decimals: 18,
    },
    simulationsEnabled: true,
    earningsEnabled: true,
    notifyEnabled: true,
    blockExplorerUrl: 'https://gnosisscan.io/',
    txConfirmations: 2,
  },
  goerli: {
    id: 'goerli',
    name: 'Goerli',
    networkId: 5,
    rpcUrl: 'https://goerli.infura.io/v3/',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'GoerliETH',
      decimals: 18,
    },
    simulationsEnabled: true,
    earningsEnabled: true,
    notifyEnabled: true,
    blockExplorerUrl: 'https://goerli.etherscan.io/',
    txConfirmations: 2,
  },
  // NOTE: Arbitrum is not yet supported!
  // arbitrum: {
  //   id: 'arbitrum',
  //   name: 'Arbitrum',
  //   networkId: 42161,
  //   rpcUrl: 'https://arb1.arbitrum.io/rpc',
  //   nativeCurrency: {
  //     name: 'Ethereum',
  //     symbol: 'ETH',
  //     decimals: 18,
  //   },
  //   simulationsEnabled: false,
  //   earningsEnabled: false,
  //   notifyEnabled: false,
  //   blockExplorerUrl: 'https://arbiscan.io',
  //   txConfirmations: 2,
  // },
};
const BLACKLISTED_LINES = ['0x0000000000000000000000000000000000000000', '0xd3d2030c9a0be7b6c6c32ccecb8df011b22f942d'];

export const getConstants = memoize((): Constants => {
  const { ALCHEMY_API_KEY } = getEnv();
  return {
    STATE_VERSION: 1,
    ETHEREUM_ADDRESS: TOKEN_ADDRESSES.ETH,
    TOKEN_ADDRESSES: TOKEN_ADDRESSES,
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
    MAX_UINT256: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    DEBT_DAO_API: 'https://api.yearn.finance/v1/chains/1/vaults/all',
    DEBT_DAO_ALERTS_API: 'http://yearn-alerts-balancer-2019386215.us-east-1.elb.amazonaws.com',
    SUPPORTED_NETWORKS: ['mainnet'],
    // Separate yearn networks with vs networks we added.
    ALL_NETWORKS: ['mainnet', 'goerli'], //  'gnosis',
    CHAIN_IDS: CHAIN_IDS,
    CHAIN_NAMES: CHAIN_NAMES,
    NETWORK_SETTINGS,
    MAINNET_PROVIDER_HTTPS: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
    MAINNET_PROVIDER_WSS: `wss://eth-mainnet.ws.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
    GNOSIS_PROVIDER_HTTPS: `https://rpc.gnosis.gateway.fm/`,
    // GNOSIS_PROVIDER_WSS: `wss://eth-mainnet.ws.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
    GOERLI_PROVIDER_HTTPS: 'https://goerli.infura.io/v3/',
    // GOERLI_PROVIDER_WSS: `FILL THIS IN`,
    ARBITRUM_PROVIDER_HTTPS: 'https://arb1.arbitrum.io/rpc',
    BLACKLISTED_LINES: BLACKLISTED_LINES,
    CONTRACT_ADDRESSES: {
      zapIn: '0x8E52522E6a77578904ddd7f528A22521DC4154F5',
      zapOut: '0xd6b88257e91e4E4D4E990B3A858c849EF2DFdE8c',
      pickleZapIn: '0xc695f73c1862e050059367B2E64489E66c525983',
      y3CrvBackZapper: '0x579422A1C774470cA623329C69f27cC3bEB935a1',
      trustedVaultMigrator: '0x1824df8D751704FA10FA371d62A37f9B8772ab90',
      triCryptoVaultMigrator: '0xC306a5ef4B990A7F2b3bC2680E022E6a84D75fC1',
      ...TOKEN_ADDRESSES,
      ...PARTNERS,
    },
    MAX_INTEREST_RATE: 20000, // 200% APR
    SLIPPAGE_OPTIONS: [0.01, 0.02, 0.03],
    DEFAULT_SLIPPAGE: 0.01,
    IRON_BANK_MAX_RATIO: 0.8,
    ZAP_OUT_TOKENS: [
      TOKEN_ADDRESSES.ETH,
      TOKEN_ADDRESSES.DAI,
      TOKEN_ADDRESSES.USDC,
      TOKEN_ADDRESSES.USDT,
      TOKEN_ADDRESSES.WBTC,
    ],
    DEFAULT_THEME: 'classic',
    AVAILABLE_THEMES: ['system-prefs', 'light', 'dark', 'cyberpunk', 'classic'],
    AVAILABLE_CUSTOM_THEMES: ['explorer'],
    DEFAULT_ALERT_TIMEOUT: 3000,
    OPTIMISTIC_UPDATE_TIMESTAMP: 1234,
    DEFAULT_LANG: 'en',
    SUPPORTED_LANGS: ['en', 'es', 'ja', 'zh'],
    DUST_AMOUNT_USD: '10000000',
    ASSETS_ICON_URL: 'https://raw.githubusercontent.com/yearn/yearn-assets/master/icons/multichain-tokens/1/',
  };
});

export const testTokens: TokenView[] = [
  {
    address: '0x3730954eC1b5c59246C1fA6a20dD6dE6Ef23aEa6',
    allowancesMap: {},
    balance: '0',
    balanceUsdc: '0',
    categories: ['Seerocoin'],
    decimals: 18,
    description: 'SeeroTestCoin',
    icon: 'https://raw.githack.com/yearn/yearn-assets/master/icons/mult…ns/1/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo-128.png',
    name: 'Serooocoin',
    priceUsdc: '0',
    symbol: 'SER',
    website: 'https://debtdao.finance/',
    // yield: '0',
  },
  {
    address: '0x589a0b00a0dD78Fc2C94b8eac676dec4C3Dcd562',
    allowancesMap: {},
    balance: '0',
    balanceUsdc: '0',
    categories: ['CollateralCoin'],
    decimals: 18,
    description: 'CollateralCoin',
    icon: 'https://raw.githack.com/yearn/yearn-assets/master/icons/mult…ns/1/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo-128.png',
    name: 'CollateralCoin',
    priceUsdc: '0',
    symbol: 'COL',
    website: 'https://debtdao.finance/',
    // yield: '0',
  },
  {
    address: '0x3D4AA21e8915F3b5409BDb20f76457FCdAF8f757',
    allowancesMap: {},
    balance: '0',
    balanceUsdc: '0',
    categories: ['kiibacoin'],
    decimals: 18,
    description: 'KiibaTestCoin',
    icon: 'https://raw.githack.com/yearn/yearn-assets/master/icons/mult…ns/1/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo-128.png',
    name: 'kibaacoin',
    priceUsdc: '0',
    symbol: 'KIB',
    website: 'https://debtdao.finance/',
    // yield: '0',
  },
  {
    address: '0xe62e4B079D40CF643D3b4963e4B675eC101928df',
    allowancesMap: {},
    balance: '0',
    balanceUsdc: '0',
    categories: ['Moocoin'],
    decimals: 18,
    description: 'MooTestCoin',
    icon: 'https://raw.githack.com/yearn/yearn-assets/master/icons/mult…ns/1/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo-128.png',
    name: 'Moocoin',
    priceUsdc: '0',
    symbol: 'MOO',
    website: 'https://debtdao.finance/',
    // yield: '0',
  },
];
