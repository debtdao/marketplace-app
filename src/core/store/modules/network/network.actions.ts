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

    // TODO: remove before merging develop branch.
    // dispatch(AppActions.initApp());

    const chainSettings = {
      chainId: `0x${getNetworkId(network).toString(16)}`,
      rpcUrls: [NETWORK_SETTINGS[network].rpcUrl],
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
      blockExplorerUrls: [NETWORK_SETTINGS[network].blockExplorerUrl],
    };

    if (wallet.isCreated) {
      const action = (await dispatch(
        WalletActions.changeWalletNetwork({ network })
      )) as PayloadAction<ChangeWalletNetworkResult>;
      if (!action.payload.networkChanged) throw new Error('Wallet Network Not Changed');
    }

    // Change wallet network to match selected network in dropdown

    try {
      if (!window.ethereum) throw new Error('web3 provider No crypto wallet found!');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainSettings.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to wallet
      console.log('web3 provider switch error: ', switchError);
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ ...chainSettings }],
          });
        } catch (addError: any) {
          console.log('web3 provider add error: ', addError);
        }
      }
      // revert to previous network if user rejects request to change wallet network
      else if (switchError.code === 4001) {
        return { network: networkState.current };
      }
      // handle other "switch" errors
    }

    // Handle unsupported networks
    if (!config.SUPPORTED_NETWORKS.includes(network)) {
      return { network };
    }

    // Set Yearn context if network is supported
    else if (web3Provider.hasInstanceOf('wallet') && config.SUPPORTED_NETWORKS.includes(network)) {
      const providerType = getProviderType(network);
      const provider = web3Provider.getInstanceOf(providerType);
      const yearn = yearnSdk.getInstanceOf(network);
      yearn.context.setProvider({
        read: provider,
        write: web3Provider.getInstanceOf('wallet'),
      });
    }

    // Dispatch line data
    // const selectedLineAddress = useAppSelector(LinesSelectors.selectSelectedLineAddress);
    // const userWalletAddress = useAppSelector(WalletSelectors.selectSelectedAddress);

    // dispatch(LinesActions.getLines(defaultLineCategories));
    // dispatch(LinesActions.getLinePage({ id: selectedLineAddress! }));
    // dispatch(LinesActions.getUserPortfolio({ user: userWalletAddress! }));

    notify.config({ networkId: getNetworkId(network) });

    return { network };
  }
);

export const NetworkActions = {
  changeNetwork,
};
