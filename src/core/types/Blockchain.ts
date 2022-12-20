import _ from 'lodash';

import { getConfig } from '@config';

const { CHAIN_IDS } = getConfig();

const names = _.values(CHAIN_IDS);

// Network can be any network name within CHAIN_IDS
export type Network = typeof names[number];

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
