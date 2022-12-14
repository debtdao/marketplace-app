import { createReducer } from '@reduxjs/toolkit';

import { OnChainMetaDataState, ENSAddressPair } from '@types';

import { OnChainMetaDataActions } from './metadata.actions';

const { getABI, clearABI, getENS } = OnChainMetaDataActions;

export const initialOnChainMetaDataState: OnChainMetaDataState = {
  contractABI: undefined,
  contractFunctions: undefined,
  ENS: [],
};

export const onChainMetaDataReducer = createReducer(initialOnChainMetaDataState, (builder) => {
  builder
    .addCase(getABI.fulfilled, (state, { payload: { ABI, Functions } }) => {
      state.contractABI = ABI;
      state.contractFunctions = Functions;
      console.log(state);
    })

    .addCase(getABI.rejected, (state, { error }) => {
      state.contractABI = undefined;
      state.contractFunctions = undefined;
    })

    .addCase(clearABI, (state) => {
      state.contractABI = '';
      state.contractFunctions = [];
    })

    .addCase(getENS.fulfilled, (state, { payload: { address, ENS } }) => {
      state.ENS = [...state.ENS, { address, ENS }];
    })

    .addCase(getENS.rejected, (state, { error }) => {
      console.log('error in getENS reducer: ', error);
    })

    .addCase(getENS.pending, (state) => {
      console.log('pending getENS');
    });
});
