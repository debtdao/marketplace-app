import { getConfig } from '@config';
import { Network, ProviderType } from '@types';

const { NETWORK, CHAIN_IDS } = getConfig();

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
  const { WEB3_PROVIDER_HTTPS, ARBITRUM_PROVIDER_HTTPS } = getConfig();
  switch (network) {
    case 'mainnet':
      return WEB3_PROVIDER_HTTPS;
    // case 'arbitrum':
    //   return ARBITRUM_PROVIDER_HTTPS;
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
    default:
      throw Error('Unknown Network');
  }
};
