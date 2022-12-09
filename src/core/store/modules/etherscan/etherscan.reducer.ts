import { createReducer } from '@reduxjs/toolkit';

import { OnChainMetaDataState } from '@types';

import { OnChainMetaDataActions } from './etherscan.actions';

const { getABI, clearABI } = OnChainMetaDataActions;

export const initialOnChainMetaDataState: OnChainMetaDataState = {
  contractABI: undefined,
  contractFunctions: undefined,
};

export const onChainMetaDataReducer = createReducer(initialOnChainMetaDataState, (builder) => {
  builder
    .addCase(getABI.fulfilled, (state, { payload: { ABI, Functions } }) => {
      state.contractABI = ABI;
      state.contractFunctions = Functions;
      console.log(state);
    })

    .addCase(clearABI, (state) => {
      state.contractABI = [];
      state.contractFunctions = [];
    });
});
