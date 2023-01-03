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
  collateralMap: {},
  eventsMap: {},
  user: {
    escrowAllowances: {},
  },
  statusMap: initialCollateralActionsStatusMap,
};

const { getLines, getLineEvents, getLinePage, getUserPortfolio } = LinesActions;

const {
  setSelectedEscrow,
  setSelectedSpigot,
  setSelectedRevenueContract,
  setSelectedCollateralAsset,
  addCollateral,
  enableCollateral,
  addSpigot,
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
      // console.log('Get Lines collateral reducer collateralMap: ', state.collateralMap);
    })

    /* -------------------------------- getLineEvents ------------------------------- */
    .addCase(getLineEvents.fulfilled, (state, { payload: { lineEventsData, id } }) => {
      if (!lineEventsData) return;
      console.log('get line events collateral reducer: ', lineEventsData);
      const { escrow, spigot } = lineEventsData;
      const spigotEvents = formatSpigotCollateralEvents(spigot.events);
      console.log('get line events collateral reducer - spigotEvents: ', spigotEvents);
      // const escrowEvents = lineEventsData?.escrow.deposits.reduce((acc: CollateralEvent[], deposit) => {
      //   const events = formatCollateralEvents('escrow', deposit.token, BigNumber.from(0), deposit.events, {});
      //   return [...acc, ...events];
      // }, []);
      // Get escrow collateral events
      const escrowDeposits: BaseEscrowDepositFragResponse[] = escrow?.deposits || [];
      const escrowEvents: CollateralEvent[] = _.flatten(
        _.merge(
          escrowDeposits.map((deposit) => {
            const [totalDepositValue, depositCollateralEvents] = formatCollateralEvents(
              'escrow',
              deposit.token,
              BigNumber.from(0),
              deposit.events,
              {}
            );
            return depositCollateralEvents;
          })
        )
      );
      console.log('get line events collateral reducer - escrow events:', escrowEvents);
      // const spigotEvents =
      // if (!line) return;
      // let map: CollateralMap = {};
      // if (line.escrow) map[line.escrowId!] = line.escrow;
      // if (line.spigot) map[line.spigotId!] = line.spigot;
      // state.collateralMap = { ...state.collateralMap, ...map };
      // const combinedCollateralEvents = [...(line.escrow?.events ?? []), ...(line.spigot?.events ?? [])];
      const combinedCollateralEvents = [...escrowEvents, ...spigotEvents];
      // state.eventsMap = { ...state.eventsMap, [id]: combinedCollateralEvents };
      // console.log('Get Line Page collateral reducer collateralMap: ', map);
      console.log('get line events collateral reducer - eventsMap: ', combinedCollateralEvents);
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
      console.log('Get Line Page collateral reducer collateralMap: ', map);
      console.log('Get Line Page collateral reducer eventsMap: ', combinedCollateralEvents);
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
