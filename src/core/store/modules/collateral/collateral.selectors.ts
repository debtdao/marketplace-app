import { RootState } from '@types';

import {} from './collateral.reducer';

/* ---------------------------------- State --------------------------------- */
//const selectUserWallet = (state: RootState) => state.wallet.selectedAddress;
/* ---------------------------------- Main Selector --------------------------------- */

const selectStatusMap = (state: RootState) => state.collateral.statusMap;
const selectSelectedEscrow = (state: RootState) => state.collateral.selectedEscrow;
const selectSelectedSpigot = (state: RootState) => state.collateral.selectedSpigot;
const selectSelectedCollateralToken = (state: RootState) => state.collateral.selectedCollateralAsset;
const selectSelectedRevenueContract = (state: RootState) => state.collateral.selectedRevenueContract;

export const CollateralSelectors = {
  selectStatusMap,
  selectSelectedEscrow,
  selectSelectedSpigot,
  selectSelectedCollateralToken,
  selectSelectedRevenueContract,
};
