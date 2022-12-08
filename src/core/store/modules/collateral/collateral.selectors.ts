import { createSelector } from '@reduxjs/toolkit';

import { Address, AggregatedEscrow, AggregatedSpigot, CollateralModule, RootState } from '@types';

import {} from './collateral.reducer';

/* ---------------------------------- State --------------------------------- */
//const selectUserWallet = (state: RootState) => state.wallet.selectedAddress;
/* ---------------------------------- Main Selector --------------------------------- */

const selectStatusMap = (state: RootState) => state.collateral.statusMap;
const selectCollateralMap = (state: RootState) => state.collateral.collateralMap;
const selectCollateralEventsMap = (state: RootState) => state.collateral.eventsMap;
const selectSelectedEscrowAddress = (state: RootState) => state.collateral.selectedEscrow;
const selectSelectedSpigotAddress = (state: RootState) => state.collateral.selectedSpigot;

const selectSelectedCollateralAsset = (state: RootState) => state.collateral.selectedCollateralAsset;
const selectSelectedRevenueContractAddress = (state: RootState) => state.collateral.selectedRevenueContract;

const selectSelectedEscrow = createSelector([selectCollateralMap, selectSelectedEscrowAddress], (cMap, addy) => {
  return !addy ? undefined : (cMap[addy] as AggregatedEscrow);
});

const selectSelectedSpigot = createSelector([selectCollateralMap, selectSelectedSpigotAddress], (cMap, addy) => {
  return !addy ? undefined : (cMap[addy] as AggregatedSpigot);
});

export const CollateralSelectors = {
  selectStatusMap,
  selectSelectedEscrow,
  selectSelectedSpigot,
  selectSelectedEscrowAddress,
  selectSelectedSpigotAddress,
  selectSelectedCollateralAsset,
  selectSelectedRevenueContractAddress,
};
