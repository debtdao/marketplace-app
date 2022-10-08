export declare const Chains: {
    1: string;
    5: string;
    250: string;
    1337: string;
    42161: string;
  };
  export declare type EthMain = 1;
  export declare type GoerliMain = 5;
  export declare type FtmMain = 250;
  export declare type EthLocal = 1337;
  export declare type ArbitrumOne = 42161;
  export declare type ChainId = keyof typeof Chains;
  export declare const isEthereum: (chainId: ChainId) => boolean;
  export declare const isFantom: (chainId: ChainId) => boolean;
  export declare const isArbitrum: (chainId: ChainId) => boolean;
  export declare const isGoerli: (chainId: ChainId) => boolean;
  export declare const allSupportedChains: number[];