import { RootState } from '@src/core/types';

//import { createSelector } from '@reduxjs/toolkit';

//import { initialOnChainMetaDataState } from './etherscan.reducer';

const selectABI = (state: RootState) => state.metadata.contractABI;

export const OnChainMetaDataSelector = { selectABI };
