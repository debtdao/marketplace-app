import { createReducer } from '@reduxjs/toolkit';

import { OnChainMetaDataState } from '@types';

import { OnChainMetaDataActions } from './etherscan.actions';

const { getABI } = OnChainMetaDataActions;

export const initialOnChainMetaDataState: OnChainMetaDataState = {
  contractABI: undefined,
  contractFunctions: undefined,
};

export const onChainMetaDataReducer = createReducer(initialOnChainMetaDataState, (builder) => {
  builder.addCase(getABI.fulfilled, (state, { payload: { ABI, Functions } }) => {
    console.log('Made it here to tthe reducer');
    state.contractABI = ABI;
    state.contractFunctions = Functions;
    console.log(state);
  });
});
