import { createReducer } from '@reduxjs/toolkit';

import { OnChainMetaDataState } from '@types'; 

import { OnChainMetaDataActions } from './etherscan.actions';

const { getABI } = OnChainMetaDataActions; 

export const initialOnChainMetaDataState: OnChainMetaDataState = {
    contractABI:[],
};

const linesReducer = createReducer(initialOnChainMetaDataState, (builder) => {
    builder
    .addCase(getABI, (state, { payload: { abi } }) => {
        state.contractABI = abi;
      })
  
      .addCase(getABI, (state, { payload: { position } }) => {
        state.selectedPosition = position;
      })
  
      .addCase(getABI, (state, { payload: { position, lineAddress, positionObject, positions } }) => {
        if (positionObject !== undefined) {
          const newPositions: CreditPosition[] = positions.filter(
            (positionObj: CreditPosition) => position !== positionObj.id
          );
          newPositions.push({ ...positionObject });
  
          state.pagesMap[lineAddress].positions = newPositions;
        }
      })
})