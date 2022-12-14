import { createReducer } from '@reduxjs/toolkit';

import { OnchainMetaDataState } from '@types';

import { OnchainMetaDataActions } from './metadata.actions';

const { getABI, clearABI } = OnchainMetaDataActions;

export const initialOnchainMetaDataState: OnchainMetaDataState = {
  contractABI: undefined,
  contractFunctions: undefined,
  ENS: undefined,
};

export const onchainMetaDataReducer = createReducer(initialOnchainMetaDataState, (builder) => {
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
    });
});
