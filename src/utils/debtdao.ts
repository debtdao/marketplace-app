import EventEmitter from 'events';

import { JsonRpcProvider } from '@ethersproject/providers';

import { Address } from '../core/types';

import { ChainId } from './chain';

export class DebtDAO<T extends ChainId> {
  _ctxValue: ContextValue;
  context: Context;
  ready: Promise<void[]>;

  /**
   * Create a new SDK instance.
   * @param chainId
   * @param context plain object containing all the optional configuration
   * @param assetServiceState the asset service does some expensive computation at initialization, passing the state from a previous sdk instance can prevent this
   */
  constructor(chainId: T, context: ContextValue);
  setChainId(chainId: ChainId): void;
}

export class CustomError extends Error {
  error_type: string;

  constructor(message: string, error_type: string) {
    super(message);
    this.error_type = error_type;
  }
}

/**
 * Generic SDK error. Wrapped errors are:
 *
 * - ethers.js errors
 * - http request errors
 */
export class SdkError extends CustomError {
  error_code?: string;
  static NO_SLIPPAGE = 'no_slippage';

  constructor(message: string, error_code?: string) {
    super(message, 'sdk');
    this.error_code = error_code;
  }
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
export interface ContextValue {
  provider?: JsonRpcProvider | ReadWriteProvider;
}

const DefaultContext: ContextValue = {
  // Public API key provided by zapper.
  // see https://docs.zapper.fi/zapper-api/endpoints
  // The default tenderly dashboard for Yearn
};

/**
 * [[Context]] is the configuration object passed around every function in
 * the SDK. It contains basic information on how to access the various services
 * that the SDK aggregates.
 *
 * [[Context]] **should not** be instantiated by users, as it's managed by
 * //{@link Yearn.context}.
 */
export class Context implements ContextValue {
  static PROVIDER = 'refresh:provider';

  private ctx: ContextValue;

  /**
   * For internal events only.
   */
  events: EventEmitter;

  constructor(ctx: ContextValue) {
    this.ctx = Object.assign({}, DefaultContext, ctx);
    this.events = new EventEmitter().setMaxListeners(100);
    this.setProvider(ctx.provider);
  }

  /**
   * Change providers during executions for all services that require on-chain
   * interaction.
   * @param provider new provider(s)
   */
  setProvider(provider?: JsonRpcProvider | ReadWriteProvider): void {
    if (provider instanceof JsonRpcProvider) {
      this.ctx.provider = { read: provider, write: provider };
    } else if (provider) {
      this.ctx.provider = provider;
    }
    this.events.emit(Context.PROVIDER, this.ctx.provider);
  }

  get provider(): ReadWriteProvider {
    if (this.ctx.provider) return this.ctx.provider as ReadWriteProvider;
    throw new SdkError('provider must be undefined in Context for this feature to work.');
  }
}
export {};
