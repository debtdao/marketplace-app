import EventEmitter from 'events';

import { JsonRpcProvider } from '@ethersproject/providers';

import { Address } from '../core/types';

import { ChainId } from './chain';
import { Context, ContextValue } from './context';

export class DebtDAO<T extends ChainId> {
  _ctxValue: ContextValue;
  context: Context;
  //ready: Promise<void[]>;

  /**
   * Create a new SDK instance.
   * @param chainId
   * @param context plain object containing all the optional configuration
   * @param assetServiceState the asset service does some expensive computation at initialization, passing the state from a previous sdk instance can prevent this
   */
  constructor(chainId: T, context: ContextValue) {
    this._ctxValue = context;
    this.context = new Context(context);
  }
  setChainId(chainId: ChainId): void {}
}

export interface AddressesOverride {
  lens?: Address;
  oracle?: Address;
  adapters: {
    registryV2?: Address;
  };
  helper?: Address;
  allowList?: Address;
  partner?: Address;
}

/**
 * For particular situations it's helpful to have two separate providers, one
 * for reading data and one for writing data.
 */
export interface ReadWriteProvider {
  read: JsonRpcProvider;
  write: JsonRpcProvider;
}

/**
 * To provide configuration for simulation error reporting
 */
export interface SimulationConfiguration extends TelegramConfiguration {
  dashboardUrl?: string;
}

/**
 * Provides details about sending a message from a telegram bot to a
 * specific chat
 */
export interface TelegramConfiguration {
  telegramChatId?: string;
  telegramBotId?: string;
}

export interface CacheConfiguration {
  useCache: boolean;
  url?: string;
}

export interface SubgraphConfiguration {
  mainnetSubgraphEndpoint?: string;
  fantomSubgraphEndpoint?: string;
  arbitrumSubgraphEndpoint?: string;
  optimismSubgraphEndpoint?: string;
}

/**
 * Context options that are used to access all the data sources queried by the
 * SDK.
 */

export {};
