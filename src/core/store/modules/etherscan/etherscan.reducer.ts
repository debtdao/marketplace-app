import { createReducer } from '@reduxjs/toolkit';

import { OnChainMetaDataState } from '@types';

import { OnChainMetaDataActions } from './etherscan.actions';

const { getABI } = OnChainMetaDataActions;

export const initialOnChainMetaDataState: OnChainMetaDataState = {
  contractABI: [],
};

export const onChainMetaDataReducer = createReducer(initialOnChainMetaDataState, (builder) => {
  builder

    //@ts-ignore
    .addCase(getABI, (state, { payload: { abi } }) => {
      console.log('Made it here');
      //state.contractABI = abi;
    });
});
