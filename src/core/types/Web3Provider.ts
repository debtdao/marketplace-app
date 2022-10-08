import { DebtDAO } from '../../utils/debtdao';

import { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers';


import { Network } from './Blockchain';

export type ProviderType = 'custom' | 'wallet' | 'ethereum' | 'fantom' | 'arbitrum' | 'goerli';
export type newSdkNetwork = 1 | 250 | 5;

export interface Web3Provider {
  hasInstanceOf: (type: ProviderType) => boolean;
  getInstanceOf: (type: ProviderType) => JsonRpcProvider;
  register: (type: ProviderType, instance: JsonRpcProvider) => void;

  hasNetworkInstanceOf: (network: Network) => boolean;
  getNetworkInstanceOf: (network: Network) => DebtDAO<newSdkNetwork>;
  registerNetwork: (network: Network, instance: DebtDAO<newSdkNetwork>) => void;
  getSigner: () => JsonRpcSigner;
}






