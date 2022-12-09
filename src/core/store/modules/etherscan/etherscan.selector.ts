import { RootState } from '@src/core/types';

//import { createSelector } from '@reduxjs/toolkit';

//import { initialOnChainMetaDataState } from './etherscan.reducer';

const selectABI = (state: RootState) => state.metadata.contractABI;
const selectFunctions = (state:RootState) => state.metadata.contractFunctions;

export const OnChainMetaDataSelector = { selectABI, selectFunctions };
