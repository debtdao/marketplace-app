import { getConfig } from '@config';
import { Network, ProviderType } from '@types';

const { NETWORK, CHAIN_IDS } = getConfig();

// TODO: use CHAIN_IDS to from Network to Id
export const getNetworkId = (network: Network): number => {
  switch (network) {
    case 'mainnet':
      return 1;
    case 'goerli':
      return 5;
    default:
      return 0;
  }
};

export const getNetwork = (networkId?: number | string): Network => {
  // TODO find out why undefined is a string instead of actual undefined
  const id = !networkId || networkId === 'undefined' ? NETWORK : networkId;
  if (id !== undefined) {
    return typeof id === 'string' ? id : CHAIN_IDS[Number(id)];
  } else {
    console.warn(`Unknown networkId: ${id} (as ${typeof id})`);
    return 'other';
  }
};

export const getNetworkRpc = (network: Network): string => {
  const { MAINNET_PROVIDER_HTTPS, ARBITRUM_PROVIDER_HTTPS, GOERLI_PROVIDER_HTTPS } = getConfig();
  switch (network) {
    case 'mainnet':
      return MAINNET_PROVIDER_HTTPS;
    // case 'arbitrum':
    //   return ARBITRUM_PROVIDER_HTTPS;
    case 'goerli':
      return GOERLI_PROVIDER_HTTPS;
    default:
      throw Error('Unknown Network');
  }
};

export const getProviderType = (network: Network): ProviderType => {
  switch (network) {
    case 'mainnet':
      return 'ethereum';
    // case 'arbitrum':
    //   return 'arbitrum';
    case 'goerli':
      return 'goerli';
    default:
      throw Error('Unknown Network');
  }
};
