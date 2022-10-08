import EventEmitter from 'events';

import { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers';
import { ChainId } from './chain';


export interface ReadWriteProvider {
    read: JsonRpcProvider;
    write: JsonRpcProvider;
  }
  
  interface ContextValue {
    provider?: JsonRpcProvider | ReadWriteProvider;
  
  }
  
  export declare class Context implements ContextValue {
    static PROVIDER: string;
    private ctx;
    /**
     * For internal events only.
     */
    events: EventEmitter;
    constructor(ctx: ContextValue);
    /**
     * Change providers during executions for all services that require on-chain
     * interaction.
     * @param provider new provider(s)
     */
    setProvider(provider?: JsonRpcProvider | ReadWriteProvider): void;
    get provider(): ReadWriteProvider;
  
  }

export declare class DebtDAO<T extends ChainId> {
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