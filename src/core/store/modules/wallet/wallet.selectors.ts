import { getNetwork } from '@utils';
import { RootState } from '@types';
import { getConfig } from '@src/config';

const { NETWORK } = getConfig();

const selectWallet = (state: RootState) => state.wallet;
const selectWalletIsConnected = (state: RootState) => !!state.wallet.selectedAddress;
const selectSelectedAddress = (state: RootState) => state.wallet.selectedAddress;
const selectAddressEnsName = (state: RootState) => state.wallet.addressEnsName;
const selectWalletNetwork = (state: RootState) => {
  return state.wallet.networkVersion ? getNetwork(state.wallet.networkVersion) : getNetwork(NETWORK);
};
const selectWalletNetworkName = (state: RootState) => {
  const walletNetwork = state.wallet.networkVersion ? getNetwork(state.wallet.networkVersion) : getNetwork(NETWORK);
  const walletNetworkName =
    walletNetwork === 'mainnet' ? 'Ethereum' : walletNetwork[0].toUpperCase() + walletNetwork.substring(1);
  return walletNetworkName;
};

export const WalletSelectors = {
  selectWallet,
  selectWalletIsConnected,
  selectSelectedAddress,
  selectAddressEnsName,
  selectWalletNetwork,
  selectWalletNetworkName,
};
