import { createReducer } from '@reduxjs/toolkit';
import _ from 'lodash';
import { BigNumber } from 'ethers';

import {
  CollateralState,
  CollateralActionsStatusMap,
  CollateralModule,
  CollateralMap,
  SecuredLine,
  CollateralEvent,
  BaseEscrowDepositFragResponse,
} from '@types';
import { formatCollateralEvents, formatSpigotCollateralEvents } from '@src/utils';

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
  selectedCollateralAsset: undefined,
  selectedRevenueContract: undefined,
  reserves: {},
  collateralMap: {},
  eventsMap: {},
  user: {
    escrowAllowances: {},
  },
  statusMap: initialCollateralActionsStatusMap,
};

const { getLines, getLinePage, getUserPortfolio } = LinesActions;

const {
  setSelectedEscrow,
  setSelectedSpigot,
  setSelectedRevenueContract,
  setSelectedCollateralAsset,
  addCollateral,
  enableCollateral,
  addSpigot,
  tradeable,
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
    /* -------------------------------- enableCollateral ------------------------------- */
    .addCase(enableCollateral.pending, (state, payload) => {
      // state.statusMap.enableCollateral = { loading: true };
    })
    .addCase(enableCollateral.fulfilled, (state, payload) => {
      // state.statusMap.enableCollateral = {};
    })
    .addCase(enableCollateral.rejected, (state, { error }) => {
      // state.statusMap.enableCollateral = { error: error.message };
    })
    /* -------------------------------- addCollateral ------------------------------- */
    .addCase(addCollateral.pending, (state, payload) => {
      // state.statusMap.addCollateral = { loading: true };
    })
    .addCase(addCollateral.fulfilled, (state, payload) => {
      // state.statusMap.addCollateral = {};
    })
    .addCase(addCollateral.rejected, (state, { error }) => {
      // _.assignIn(state.statusMap.addCollateral, { [contract]: { [token]: { error: error.message } } });
    })

    /* ---------------------------------- addSpigot ----------------------------------------*/

    .addCase(addSpigot.pending, (state, payload) => {})
    .addCase(addSpigot.fulfilled, (state, payload) => {
      // state.statusMap.addCollateral = {};
    })
    .addCase(addSpigot.rejected, (state, { error }) => {
      // _.assignIn(state.statusMap.addCollateral, { [contract]: { [token]: { error: error.message } } });
    })

    // State changes from non collateral actions

    /* -------------------------------- getLines ------------------------------- */
    .addCase(getLines.fulfilled, (state, { payload: { linesData: lines } }) => {
      if (!lines) return;
      let map: CollateralMap = {};

      // loop over array of lines and update collateral state
      Object.entries(lines).map(([category, ls]) =>
        ls?.map((line) => {
          if (line.escrow) map[line.escrowId!] = line.escrow;
          if (line.spigot) map[line.spigotId!] = line.spigot;
        })
      );
      state.collateralMap = { ...state.collateralMap, ...map };
    })

    /* -------------------------------- getLinePage ------------------------------- */
    .addCase(getLinePage.fulfilled, (state, { payload: { linePageData: line } }) => {
      if (!line) return;
      let map: CollateralMap = {};
      if (line.escrow) map[line.escrowId!] = line.escrow;
      if (line.spigot) map[line.spigotId!] = line.spigot;
      state.collateralMap = { ...state.collateralMap, ...map };
      const combinedCollateralEvents = [...(line.escrow?.events ?? []), ...(line.spigot?.events ?? [])];
      state.eventsMap = { ...state.eventsMap, [line.id]: combinedCollateralEvents };
    })

    /* -------------------------------- getUserPortfolio ------------------------------- */
    .addCase(getUserPortfolio.fulfilled, (state, { payload: { address, lines } }) => {
      let map: CollateralMap = {};
      _.values<SecuredLine>(lines).map((line) => {
        if (line.escrow) map[line.escrowId!] = line.escrow;
        if (line.spigot) map[line.spigotId!] = line.spigot;
      });
      state.collateralMap = { ...state.collateralMap, ...map };
    })
    /* -------------------------------- claimTradeableTokens ------------------------------- */
    .addCase(tradeable.fulfilled, (state, { payload: { claimableTokens } }) => {
      console.log('claimableTokens', claimableTokens);
      // state.reserves
    });
});

export default collateralReducer;
