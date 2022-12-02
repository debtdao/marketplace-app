import { initialOnChainMetaDataState } from "./etherscan.reducer";

import { RootState } from "@src/core/types";

const seletctOnChainMetaData = (state: RootState) => state.onChainMetaData.contractABI;

export const OnChainMetaDataSelector ={ seletctOnChainMetaData };