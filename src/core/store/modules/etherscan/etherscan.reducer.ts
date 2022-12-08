import { createReducer } from '@reduxjs/toolkit';

import { OnChainMetaDataState } from '@types';

import { OnChainMetaDataActions } from './etherscan.actions';

const { getABI } = OnChainMetaDataActions;

export const initialOnChainMetaDataState: OnChainMetaDataState = {
  contractABI: undefined,
};

export const onChainMetaDataReducer = createReducer(initialOnChainMetaDataState, (builder) => {
  //@ts-ignore
  builder.addCase(getABI.fulfilled, (state, { payload: { abi } }) => {
    console.log('Made it here to tthe reducer');
    state.contractABI = abi;
  });
});
