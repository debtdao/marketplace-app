import { isEqual } from 'lodash';
import { createReducer } from '@reduxjs/toolkit';

import { ENSAddressPair, OnchainMetaDataState } from '@types';

import { OnchainMetaDataActions } from './metadata.actions';

const { getABI, clearABI, getENS } = OnchainMetaDataActions;

export const initialOnchainMetaDataState: OnchainMetaDataState = {
  contractABI: undefined,
  contractFunctions: undefined,
  ENS: [],
};

export const onchainMetaDataReducer = createReducer(initialOnchainMetaDataState, (builder) => {
  builder
    .addCase(getABI.fulfilled, (state, { payload: { abi, functions } }) => {
      state.contractABI = abi;
      state.contractFunctions = functions;
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
      const newState = [...state.ENS, { address, ENS }];

      const result: ENSAddressPair[] = [];

      for (const item of newState) {
        const found = result.some((value) => isEqual(value, item));
        if (found) return;
        result.push(item);
      }

      state.ENS = newState;
    })

    .addCase(getENS.rejected, (state, { error }) => {
      console.log('error in getENS reducer: ', error);
    })

    .addCase(getENS.pending, (state) => {
      console.log('pending getENS');
    });
});
