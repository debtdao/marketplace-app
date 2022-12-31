// NOTE: This code was adapted from Yearn SDK: https://github.com/yearn/yearn-sdk/blob/546e583/src/interfaces/token.ts#L93
// The Yearn SDK function, balances, fails to return data.

import { Address, Yearn } from '@yfi/sdk';

import { getConstants } from '@src/config/constants';

import { Balance, Network, SdkNetwork } from '../core/types';

import { getNetworkId } from './network';

const { SUPPORTED_NETWORKS } = getConstants();

/**
 * Fetch token balance for a particular account.
 *
 * @param account user wallet address
 * @param tokenAddresses list of token addresses
 *
 * @returns list of balances for the supported tokens
 */
export const getBalances = async (yearn: Yearn<SdkNetwork>, network: string, account: Address): Promise<Balance[]> => {
  const supportedNetworkIds = SUPPORTED_NETWORKS.map((network: Network) => getNetworkId(network));
  if (supportedNetworkIds.includes(yearn.tokens.chainId)) {
    const vaultBalances = await yearn.vaults.balances(account);
    const filteredBalances = vaultBalances.filter(({ address, balance }) => balance !== '0');
    return filteredBalances;
  }

  console.error(`the chain ${yearn.tokens.chainId} hasn't been implemented yet`);

  return [];
};
