import { RootState } from '@src/core/types';

import { initialOnChainMetaDataState } from './etherscan.reducer';

const seletctOnChainMetaData = (state: RootState) => state.metadata.contractABI;

export const OnChainMetaDataSelector = { seletctOnChainMetaData };
