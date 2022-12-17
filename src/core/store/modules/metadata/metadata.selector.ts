import { RootState } from '@src/core/types';

const selectABI = (state: RootState) => state.metadata.contractABI;
const selectFunctions = (state: RootState) => state.metadata.contractFunctions;
const selectENSPairs = (state: RootState) => state.metadata.ens;

export const OnchainMetaDataSelector = { selectABI, selectFunctions, selectENSPairs };
