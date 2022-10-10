import { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers';

import { getProviderType, getNetworkRpc, getNetworkId } from '@utils';
import { Network, ProviderType, Web3Provider, newSdkNetwork } from '@types';
import { getConfig } from '@config';
import { DebtDAO } from '@utils';

import { getJsonRpcProvider } from './';

export class EthersWeb3ProviderImpl implements Web3Provider {
  private instances: Map<ProviderType, JsonRpcProvider> = new Map<ProviderType, JsonRpcProvider>();
  private instances_1: Map<Network, DebtDAO<newSdkNetwork>> = new Map<Network, DebtDAO<newSdkNetwork>>();

  constructor() {
    const { DEBT_DAO_NETWORKS, CUSTOM_PROVIDER_HTTPS, USE_MAINNET_FORK } = getConfig();
    DEBT_DAO_NETWORKS.forEach((network) => {
      const rpcUrl = getNetworkRpc(network);
      const provider = getJsonRpcProvider(rpcUrl);
      const providerType = getProviderType(network);
      const networkId = getNetworkId(network) as newSdkNetwork;
      console.log(rpcUrl, provider, networkId, 'testing list');
      this.register(providerType, provider);
      const newSdkNetwork = new DebtDAO(networkId, {
        provider: provider,
      });
      this.registerNetwork(network, newSdkNetwork);
    });
    if (USE_MAINNET_FORK) this.register('custom', getJsonRpcProvider(CUSTOM_PROVIDER_HTTPS));
    console.log(DEBT_DAO_NETWORKS, 'TEST WEB3 PROVIDER NETWORKS');
  }

  public hasInstanceOf(type: ProviderType): boolean {
    return this.instances.has(type);
  }

  public getInstanceOf(type: ProviderType): JsonRpcProvider {
    const instance = this.instances.get(type);

    if (!instance) {
      throw new Error(`EthersWeb3ProviderImpl has no "${type}" provider registered`);
    }

    return instance;
  }

  public getNetworkInstanceOf(network: Network): DebtDAO<newSdkNetwork> {
    const instance = this.instances_1.get(network);

    if (!instance) {
      throw new Error(`EthersWeb3ProviderImpl has no "${network}" network registered`);
    }

    return instance;
  }
  public hasNetworkInstanceOf(network: Network): boolean {
    return this.instances_1.has(network);
  }

  public register(type: ProviderType, instance: JsonRpcProvider): void {
    this.instances.set(type, instance);
  }

  public registerNetwork(network: Network, instance: DebtDAO<newSdkNetwork>): void {
    this.instances_1.set(network, instance);
  }
  public getSigner(): JsonRpcSigner {
    const provider = this.getInstanceOf('wallet');
    return provider.getSigner();
  }
}
