import { createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { ThunkAPI } from '@frameworks/redux';
import { notify } from '@frameworks/blocknative';
import { getProviderType, getNetworkId } from '@utils';
import { Network } from '@types';

import { WalletActions, ChangeWalletNetworkResult } from '../wallet/wallet.actions';

const changeNetwork = createAsyncThunk<{ network: Network }, { network: Network }, ThunkAPI>(
  'network/changeNetwork',
  async ({ network }, { dispatch, extra }) => {
    const { context, config } = extra;
    const { wallet, web3Provider, yearnSdk } = context;

    const { SUPPORTED_NETWORKS } = config;

    if (!config.SUPPORTED_NETWORKS.includes(network)) throw Error('Network Not Supported');

    if (wallet.isCreated) {
      const action = (await dispatch(
        WalletActions.changeWalletNetwork({ network })
      )) as PayloadAction<ChangeWalletNetworkResult>;
      if (!action.payload.networkChanged) throw new Error('Wallet Network Not Changed');
    }

    if (web3Provider.hasInstanceOf('wallet')) {
      const providerType = getProviderType(network);
      const provider = web3Provider.getInstanceOf(providerType);
      if (SUPPORTED_NETWORKS.includes(network)) {
        const yearn = yearnSdk.getInstanceOf(network);
        yearn.context.setProvider({
          read: provider,
          write: web3Provider.getInstanceOf('wallet'),
        });
      }
    }

    notify.config({ networkId: getNetworkId(network) });

    return { network };
  }
);

export const NetworkActions = {
  changeNetwork,
};
