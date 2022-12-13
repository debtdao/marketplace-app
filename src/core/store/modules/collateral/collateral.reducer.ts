import { createReducer } from '@reduxjs/toolkit';
import _ from 'lodash';

import { CollateralState, CollateralActionsStatusMap, CollateralModule, CollateralMap, SecuredLine } from '@types';

import { LinesActions } from '../lines/lines.actions';

import { CollateralActions } from './collateral.actions';

export const initialCollateralActionsStatusMap: CollateralActionsStatusMap = {
  approve: {},
  addCollateral: {},
  enableCollateral: {},
  addSpigot: {},
  releaseSpigot: {},
  updateOwnerSplit: {},
  getLineCollateralData: {},
};

export const collateralInitialState: CollateralState = {
  selectedEscrow: undefined,
  selectedSpigot: undefined,
  collateralMap: {},
  eventsMap: {},
  user: {
    escrowAllowances: {},
  },
  statusMap: initialCollateralActionsStatusMap,
};

const { getLinePage, getUserPortfolio } = LinesActions;

const {
  setSelectedEscrow,
  setSelectedSpigot,
  setSelectedRevenueContract,
  setSelectedCollateralAsset,
  addCollateral,
  enableCollateral,
  saveModuleToMap,
  saveEventsToMap,
} = CollateralActions;

const collateralReducer = createReducer(collateralInitialState, (builder) => {
  builder
    /* -------------------------------------------------------------------------- */
    /*                                   Setters                                  */
    /* -------------------------------------------------------------------------- */
    .addCase(setSelectedEscrow, (state, { payload: { escrowAddress } }) => {
      state.selectedEscrow = escrowAddress;
    })
    .addCase(setSelectedSpigot, (state, { payload: { spigotAddress } }) => {
      state.selectedSpigot = spigotAddress;
    })
    .addCase(setSelectedRevenueContract, (state, { payload: { contractAddress } }) => {
      state.selectedRevenueContract = contractAddress;
    })
    .addCase(setSelectedCollateralAsset, (state, { payload: { assetAddress } }) => {
      state.selectedCollateralAsset = assetAddress;
    })

    // .addCase(saveEventsToMap.fulfilled, (state, { payload: { moduleAddress, events } }) => {
    //   state.eventsMap[moduleAddress] = events;
    // })

    // .addCase(saveModuleToMap.fulfilled, (state, { payload: { moduleAddress, module } }) => {
    //   state.collateralMap[moduleAddress] = module;
    // })

    /* -------------------------------- enableCollateral ------------------------------- */
    .addCase(enableCollateral.pending, (state, payload) => {
      console.log('collateral action payload', payload);
      // state.statusMap.enableCollateral = { loading: true };
    })
    .addCase(enableCollateral.fulfilled, (state, payload) => {
      console.log('collateral action payload', payload);
      // state.statusMap.enableCollateral = {};
    })
    .addCase(enableCollateral.rejected, (state, { error }) => {
      // state.statusMap.enableCollateral = { error: error.message };
    })
    /* -------------------------------- addCollateral ------------------------------- */
    .addCase(addCollateral.pending, (state, payload) => {
      console.log('collateral action payload', payload);
      // state.statusMap.addCollateral = { loading: true };
    })
    .addCase(addCollateral.fulfilled, (state, payload) => {
      console.log('collateral action payload', payload);
      // state.statusMap.addCollateral = {};
    })
    .addCase(addCollateral.rejected, (state, { error }) => {
      // _.assignIn(state.statusMap.addCollateral, { [contract]: { [token]: { error: error.message } } });
    })

    // State changes from non collateral actions

    /* -------------------------------- getLinePage ------------------------------- */
    .addCase(getLinePage.fulfilled, (state, { payload: { linePageData: line } }) => {
      if (!line) return;
      let map: CollateralMap = {};
      if (line.escrow) map[line.escrowId!] = line.escrow;
      if (line.spigot) map[line.spigotId!] = line.spigot;
      state.collateralMap = { ...state.collateralMap, ...map };
    })

    /* -------------------------------- getUserPortfolio ------------------------------- */
    .addCase(getUserPortfolio.fulfilled, (state, { payload: { address, lines } }) => {
      let map: CollateralMap = {};
      _.values<SecuredLine>(lines).map((line) => {
        if (line.escrow) map[line.escrowId!] = line.escrow;
        if (line.spigot) map[line.spigotId!] = line.spigot;
      });
      state.collateralMap = { ...state.collateralMap, ...map };
    });
});

export default collateralReducer;
