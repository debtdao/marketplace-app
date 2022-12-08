import { createReducer } from '@reduxjs/toolkit';

import { OnChainMetaDataState } from '@types';

import { OnChainMetaDataActions } from './etherscan.actions';

const { getABI } = OnChainMetaDataActions;

export const initialOnChainMetaDataState: OnChainMetaDataState = {
  contractABI: undefined,
};

export const onChainMetaDataReducer = createReducer(initialOnChainMetaDataState, (builder) => {
  builder.addCase(getABI.fulfilled, (state, { payload: { ABI } }) => {
    console.log('Made it here to tthe reducer');
    state.contractABI = ABI;
    console.log(state);
  });
});
