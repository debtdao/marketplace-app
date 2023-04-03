import { Network, Address, Wei } from './Blockchain';
import { NetworkSettings, Theme, Language } from './Settings';

export interface Config extends Env, Constants {}

export interface Env {
  ENV: string;
  VERSION: string;
  NETWORK: Network;
  CUSTOM_PROVIDER_HTTPS: string;
  USE_MAINNET_FORK: boolean;
  USE_SDK_MOCK: boolean;
  ALLOW_DEV_MODE: boolean;
  INFURA_PROJECT_ID: string | undefined;
  ETHERSCAN_API_KEY: string | undefined;
  ALCHEMY_API_KEY: string | undefined;
  BLOCKNATIVE_KEY: string | undefined;
  FORTMATIC_KEY: string | undefined;
  PORTIS_KEY: string | undefined;
  SEGMENT_API_KEY: string | undefined;
  // ZAPPER_API_KEY: string | undefined;
  MAINNET_GRAPH_API_URL: string | undefined;
  GOERLI_GRAPH_API_URL: string | undefined;
  GNOSIS_GRAPH_API_URL: string | undefined;
  GRAPH_CHAINLINK_FEED_REGISTRY_API_URL: string | undefined;
}

export interface Constants {
  STATE_VERSION: number;
  ETHEREUM_ADDRESS: Address;
  TOKEN_ADDRESSES: {
    [KEY: string]: string;
  };
  ZERO_ADDRESS: string;
  MAX_UINT256: Wei;
  DEBT_DAO_API: string;
  DEBT_DAO_ALERTS_API: string;
  SUPPORTED_NETWORKS: Network[];
  // Separate yearn networks with vs networks we added.
  ALL_NETWORKS: Network[];
  CHAIN_IDS: {
    [KEY: number]: string;
  };
  CHAIN_NAMES: {
    [KEY: string]: string;
  };
  NETWORK_SETTINGS: NetworkSettings;
  MAINNET_PROVIDER_HTTPS: string;
  MAINNET_PROVIDER_WSS: string;
  GNOSIS_PROVIDER_HTTPS: string;
  GOERLI_PROVIDER_HTTPS: string;
  ARBITRUM_PROVIDER_HTTPS: string;
  BLACKLISTED_LINES: string[];
  CONTRACT_ADDRESSES: {
    [KEY: string]: string;
  };
  MAX_INTEREST_RATE: number;
  SLIPPAGE_OPTIONS: number[];
  DEFAULT_SLIPPAGE: number;
  IRON_BANK_MAX_RATIO: number;
  ZAP_OUT_TOKENS: string[];
  DEFAULT_THEME: Theme;
  AVAILABLE_THEMES: Theme[];
  AVAILABLE_CUSTOM_THEMES: Theme[];
  DEFAULT_ALERT_TIMEOUT: number;
  OPTIMISTIC_UPDATE_TIMESTAMP: number;
  DEFAULT_LANG: Language;
  SUPPORTED_LANGS: Language[];
  DUST_AMOUNT_USD: string;
  ASSETS_ICON_URL: string;
  // ZAPPER_AUTH_TOKEN: string;
  //Arbiter_GOERLI: Address;
  //Oracle_GOERLI: Address;
  //SwapTarget_GOERLI: Address;
  //SecuredLine_GOERLI: Address;
  //KibaSero_oracle: string;
}
