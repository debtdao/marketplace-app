import { createReducer } from '@reduxjs/toolkit';

import { OnChainMetaDataState } from '@types';

import { OnChainMetaDataActions } from './metadata.actions';

const { getABI, clearABI } = OnChainMetaDataActions;

export const initialOnChainMetaDataState: OnChainMetaDataState = {
  contractABI: undefined,
  contractFunctions: undefined,
  functionSignatures: undefined,
  ENS: undefined,
};

export const onChainMetaDataReducer = createReducer(initialOnChainMetaDataState, (builder) => {
  builder
    .addCase(getABI.fulfilled, (state, { payload: { ABI, Functions, Signatures } }) => {
      state.contractABI = ABI;
      state.contractFunctions = Functions;
      state.functionSignatures = Signatures;
      console.log(state);
    })

    .addCase(clearABI, (state) => {
      state.contractABI = [];
      state.contractFunctions = [];
      state.functionSignatures = [];
    });
});
