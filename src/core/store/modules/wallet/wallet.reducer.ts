import { createReducer } from '@reduxjs/toolkit';
import { getAddress } from '@ethersproject/address';

import { WalletState } from '@types';
import { getNetworkId } from '@src/utils';

import { NetworkActions } from '../network/network.actions';

import { WalletActions } from './wallet.actions';

export const walletInitialState: WalletState = {
  selectedAddress: undefined,
  addressEnsName: undefined,
  networkVersion: undefined,
  balance: undefined,
  name: undefined,
  isConnected: false,
  isLoading: false,
  error: undefined,
};

const {
  addressChange,
  balanceChange,
  networkChange,
  walletChange,
  walletSelect,
  getAddressEnsName,
  // changeWalletNetwork,
} = WalletActions;

const { changeNetwork, changeNetworkGoerli } = NetworkActions;

const walletReducer = createReducer(walletInitialState, (builder) => {
  builder
    .addCase(walletChange, (state, { payload: { walletName } }) => {
      state.name = walletName;
    })
    .addCase(addressChange, (state, { payload: { address } }) => {
      state.addressEnsName = undefined;
      state.selectedAddress = address ? getAddress(address) : undefined;
    })
    .addCase(networkChange, (state, { payload: { network } }) => {
      console.log('subgraph wallet networkChange reducer: ', network);
      state.networkVersion = network;
    })
    // Use networkId to set the state
    // .addCase(changeWalletNetwork.fulfilled, (state, { payload: { networkChanged, networkId } }) => {
    //   console.log('subgraph wallet reducer networkId: ', networkId);
    //   state.networkVersion = networkId;
    //   console.log('subgraph wallet reducer state: ', state.networkVersion);
    // })
    .addCase(balanceChange, (state, { payload: { balance } }) => {
      state.balance = balance;
    })
    .addCase(walletSelect.pending, (state) => {
      state.isLoading = true;
      state.error = undefined;
    })
    .addCase(walletSelect.fulfilled, (state, { payload: { isConnected } }) => {
      state.isConnected = isConnected;
      state.isLoading = false;
    })
    .addCase(walletSelect.rejected, (state, { error }) => {
      state.isLoading = false;
      state.error = error.message;
    })
    .addCase(getAddressEnsName.fulfilled, (state, { payload: { addressEnsName } }) => {
      state.addressEnsName = addressEnsName;
    })
    // synchronize network across network, lines, and wallet state
    .addCase(changeNetwork.fulfilled, (state, { payload }) => {
      // state.current = payload.network;
      state.networkVersion = getNetworkId(payload.network);
    })
    .addCase(changeNetworkGoerli, (state) => {
      // state.current = 'goerli';
      state.networkVersion = 5;
    });
});

export default walletReducer;
