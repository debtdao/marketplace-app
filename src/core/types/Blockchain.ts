import _ from 'lodash';

import { getConfig } from '@config';

const { CHAIN_IDS } = getConfig();

const names = _.values(CHAIN_IDS);
console.log('ChainId names: ', names);
// console.log('ChainId names 2: ', typeof names[number]);

// Network can be any network name within CHAIN_IDS
export type Network = typeof names[number];
// export type Network = 'mainnet' | 'ropsten' | 'rinkeby' | 'kovan' | 'arbitrum' | 'other' | 'goerli';

export type Symbol = string;

export type Address = string;

export type Wei = string;

export type Unit = string;

export type RpcUrl = string;

export interface GasFees {
  gasPrice?: Wei;
  maxFeePerGas?: Wei;
  maxPriorityFeePerGas?: Wei;
}

// based off our standard event data in subgraph
export interface Event {
  type: string;
  address: Address;
  block: number;
  timestamp: string;
}
