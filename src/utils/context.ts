import EventEmitter from 'events';

import { JsonRpcProvider } from '@ethersproject/providers';

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

export interface ReadWriteProvider {
  read: JsonRpcProvider;
  write: JsonRpcProvider;
}

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
export class CustomError extends Error {
  error_type: string;
  constructor(message: string, error_type: string) {
    super(message);
    this.error_type = error_type;
  }
}

export class SdkError extends CustomError {
  error_code?: string;
  static NO_SLIPPAGE = 'no_slippage';
  constructor(message: string, error_code?: string) {
    super(message, 'sdk');
    this.error_code = error_code;
  }
}
