import { getAddress } from '@ethersproject/address';
import { createSelector } from '@reduxjs/toolkit';

import { Address, AggregatedEscrow, AggregatedSpigot, RootState } from '@types';

import {} from './collateral.reducer';

/* ---------------------------------- State --------------------------------- */
//const selectUserWallet = (state: RootState) => state.wallet.selectedAddress;
/* ---------------------------------- Main Selector --------------------------------- */

const selectStatusMap = (state: RootState) => state.collateral.statusMap;
const selectCollateralMap = (state: RootState) => state.collateral.collateralMap;
const selectCollateralEventsMap = (state: RootState) => state.collateral.eventsMap;
const selectReservesMap = (state: RootState) => state.collateral.reservesMap;
const selectSelectedEscrowAddress = (state: RootState) => state.collateral.selectedEscrow;
const selectSelectedSpigotAddress = (state: RootState) => state.collateral.selectedSpigot;
const selectSelectedSpigotIntegration = (state: RootState) => state.collateral.selectedSpigotIntegration;
const selectSpigotForSelectedLine = (state: RootState) =>
  state.lines.linesMap[state.lines.selectedLineAddress ?? '']?.spigotId;

const selectSelectedCollateralAsset = (state: RootState) => {
  return state.collateral.selectedCollateralAsset
    ? state.tokens.tokensMap[getAddress(state.collateral.selectedCollateralAsset)]
    : undefined;
};

const selectSelectedRevenueContractAddress = (state: RootState) => state.collateral.selectedRevenueContract;

const selectSelectedEscrow = createSelector([selectCollateralMap, selectSelectedEscrowAddress], (cMap, addy) => {
  return !addy ? undefined : (cMap[addy] as AggregatedEscrow);
});

const selectSelectedSpigot = createSelector(
  [selectCollateralMap, selectSelectedSpigotAddress, selectSpigotForSelectedLine],
  (cMap, selectedSpigot, selectedLineSpigot) => {
    const addy = selectedSpigot ?? selectedLineSpigot ?? '';
    return cMap[addy] as AggregatedSpigot;
  }
);

export const CollateralSelectors = {
  selectStatusMap,
  selectCollateralMap,
  selectSelectedEscrow,
  selectSelectedSpigot,
  selectSelectedEscrowAddress,
  selectSelectedSpigotAddress,
  selectSelectedCollateralAsset,
  selectSelectedRevenueContractAddress,
  selectSelectedSpigotIntegration,
  selectCollateralEventsMap,
  selectReservesMap,
};
