import { RootState } from '@src/core/types';

const selectABI = (state: RootState) => state.metadata.contractABI;
const selectFunctions = (state: RootState) => state.metadata.contractFunctions;

export const OnchainMetaDataSelector = { selectABI, selectFunctions };
