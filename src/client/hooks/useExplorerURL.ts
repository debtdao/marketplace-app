import { getConfig } from '@src/config';
import { Network } from '@src/core/types';

const { NETWORK_SETTINGS, NETWORK } = getConfig();

export function useExplorerURL(network: Network = NETWORK): string | undefined {
  return NETWORK_SETTINGS[network].blockExplorerUrl;
}
