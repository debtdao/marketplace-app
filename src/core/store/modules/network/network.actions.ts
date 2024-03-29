import { createAsyncThunk, PayloadAction, createAction } from '@reduxjs/toolkit';

import { ThunkAPI } from '@frameworks/redux';
import { notify } from '@frameworks/blocknative';
import { getProviderType, getNetworkId } from '@utils';
import { Network, UseCreditLinesParams } from '@types';
import { AppActions, LinesActions, LinesSelectors, WalletSelectors } from '@store';
import { useAppSelector } from '@src/client/hooks';
import { getConfig } from '@src/config';

import { WalletActions, ChangeWalletNetworkResult } from '../wallet/wallet.actions';

const { NETWORK_SETTINGS } = getConfig();

const changeNetwork = createAsyncThunk<{ network: Network }, { network: Network }, ThunkAPI>(
  'network/changeNetwork',
  async ({ network }, { dispatch, getState, extra }) => {
    const { context, config } = extra;
    const { wallet, web3Provider, yearnSdk } = context;
    const { network: networkState } = getState();

    if (wallet.isCreated) {
      const action = (await dispatch(
        WalletActions.changeWalletNetwork({ network })
      )) as PayloadAction<ChangeWalletNetworkResult>;
      if (!action.payload.networkChanged) throw new Error('Wallet Network Not Changed');
    }

    if (!config.ALL_NETWORKS.includes(network)) {
      return { network };
    }

    // Handle unsupported networks
    const ethChainSettings = {
      chainId: `0x${getNetworkId(network).toString(16)}`,
      rpcUrls: [NETWORK_SETTINGS[network].rpcUrl],
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
      blockExplorerUrls: [NETWORK_SETTINGS[network].blockExplorerUrl],
    };

    const gnoChainSettings = {
      chainId: `0x${getNetworkId(network).toString(16)}`,
      rpcUrls: [NETWORK_SETTINGS[network].rpcUrl],
      nativeCurrency: {
        name: 'Gnosis Chain',
        symbol: 'xDAI',
        decimals: 18,
      },
      blockExplorerUrls: [NETWORK_SETTINGS[network].blockExplorerUrl],
    };

    // push network change to wallet
    if (network === 'mainnet') {
      await updateChainSettings(network, ethChainSettings);
    } else if (network === 'gnosis') {
      await updateChainSettings(network, gnoChainSettings);
    } else if (network === 'goerli') {
      // await updateChainSettings(network, ethChainSettings);
      return { network };
    }

    // // clear old app data
    // if (wallet.selectedAddress) {
    //   dispatch(LinesActions.clearUserData());
    //   dispatch(AppActions.clearUserAppData());
    // }

    // Set Yearn context
    if (web3Provider.hasInstanceOf('wallet') && config.SUPPORTED_NETWORKS.includes(network)) {
      const providerType = getProviderType(network);
      const provider = web3Provider.getInstanceOf(providerType);
      const yearn = yearnSdk.getInstanceOf(network);
      yearn.context.setProvider({
        read: provider,
        write: web3Provider.getInstanceOf('wallet'),
      });
    }

    notify.config({ networkId: getNetworkId(network) });

    return { network };
  }
);

const updateChainSettings = async (currentNetwork: string, newChainSettings: any) => {
  // TODO probably need to do things in here for full frame support

  // Change wallet network to match selected network in dropdown
  try {
    if (!window.ethereum) throw new Error('web3 provider No crypto wallet found!');
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: newChainSettings.chainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to wallet
    console.log('web3 provider switch error: ', switchError);
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{ ...newChainSettings }],
        });
      } catch (addError: any) {
        console.log('web3 provider add error: ', addError);
      }
    }
    // revert to previous network if user rejects request to change wallet network
    else if (switchError.code === 4001) {
      return { network: currentNetwork };
    }
    // handle other "switch" errors
  }
};

export const NetworkActions = {
  changeNetwork,
};
