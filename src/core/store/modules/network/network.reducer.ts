import { createReducer } from '@reduxjs/toolkit';

import { NetworkState } from '@types';
import { getConfig } from '@config';

import { NetworkActions } from './network.actions';

export const networkInitialState: NetworkState = {
  current: getConfig().NETWORK,
};

const { changeNetwork, changeNetworkGoerli } = NetworkActions;

const networkReducer = createReducer(networkInitialState, (builder) => {
  builder
    .addCase(changeNetwork.fulfilled, (state, { payload }) => {
      state.current = payload.network;
    })
    .addCase(changeNetworkGoerli, (state) => {
      console.log('subgraph reducer goerli');
      state.current = 'goerli';
    });
});

export default networkReducer;
