import { createAsyncThunk, PayloadAction, createAction } from '@reduxjs/toolkit';

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

    // if (!config.SUPPORTED_NETWORKS.includes(network)) throw Error('Network Not Supported');

    if (wallet.isCreated) {
      const action = (await dispatch(
        WalletActions.changeWalletNetwork({ network })
      )) as PayloadAction<ChangeWalletNetworkResult>;
      if (!action.payload.networkChanged) throw new Error('Wallet Network Not Changed');
    }

    // Handle unsupported networks
    if (!config.SUPPORTED_NETWORKS.includes(network)) {
      return { network };
    }

    // Set Yearn context if network is supported
    else if (web3Provider.hasInstanceOf('wallet') && config.SUPPORTED_NETWORKS.includes(network)) {
      const providerType = getProviderType(network);
      const provider = web3Provider.getInstanceOf(providerType);
      console.log('change network provider: ', provider);
      const yearn = yearnSdk.getInstanceOf(network);
      // yearn.context.setProvider(provider);
      yearn.context.setProvider({
        read: provider,
        write: web3Provider.getInstanceOf('wallet'),
      });
      // const signer = web3Provider.getSigner();
      // const tx = await signer.connect(provider);
    }
    // TODO: Change wallet network when network selected in dropdown
    // else {
    //   const providerType = getProviderType(network);
    //   const provider = web3Provider.getInstanceOf(providerType);
    //   // create signer
    //   const signer = web3Provider.getSigner();
    //   // signer connects connect to new provider
    //   signer.connect(provider);
    //   // signer.connect(provider);
    // }

    notify.config({ networkId: getNetworkId(network) });

    return { network };
  }
);

export const NetworkActions = {
  changeNetwork,
};
