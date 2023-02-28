import { createReducer } from '@reduxjs/toolkit';
import _ from 'lodash';
import { BigNumber } from 'ethers';

import {
  initialStatus,
  CollateralState,
  CollateralActionsStatusMap,
  CollateralModule,
  CollateralMap,
  SecuredLine,
  CollateralEvent,
  BaseEscrowDepositFragResponse,
  ReservesMap,
  AggregatedEscrow,
  EscrowDepositMap,
  RevenueSummaryMap,
  COLLATERAL_TYPE_ASSET,
  COLLATERAL_TYPE_REVENUE,
  AggregatedSpigot,
} from '@types';
import { formatCollateralEvents, formatCollateralRevenue, formatSpigotCollateralEvents } from '@src/utils';

import { LinesActions } from '../lines/lines.actions';

import { CollateralActions } from './collateral.actions';

export const initialCollateralActionsStatusMap: CollateralActionsStatusMap = {
  approve: {},
  addCollateral: {},
  enableCollateral: initialStatus,
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
  reservesMap: {},
  collateralMap: {},
  eventsMap: {},
  user: {
    escrowAllowances: {},
  },
  statusMap: initialCollateralActionsStatusMap,
};

const { deploySecuredLineWithConfig, getLines, getLinePage, getUserPortfolio } = LinesActions;

const {
  setSelectedEscrow,
  setSelectedSpigot,
  setSelectedRevenueContract,
  setSelectedCollateralAsset,
  addCollateral,
  enableCollateral,
  addSpigot,
  tradeable,
  releaseCollateral,
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
    .addCase(enableCollateral.pending, (state) => {
      state.statusMap.enableCollateral = { loading: true };
    })
    .addCase(
      enableCollateral.fulfilled,
      (state, { payload: { escrowDeposit, lineAddress, contract, token, success } }) => {
        const escrow = state.collateralMap[contract] as AggregatedEscrow;
        const escrowDeposits = escrow.deposits ?? ({} as EscrowDepositMap);
        escrowDeposits[token.address] = escrowDeposit;
        state.collateralMap[contract] = { ...escrow, deposits: escrowDeposits };
      }
    )
    .addCase(enableCollateral.rejected, (state, { error }) => {
      state.statusMap.enableCollateral = { error: error.message };
    })
    /* -------------------------------- addCollateral ------------------------------- */
    .addCase(addCollateral.pending, (state, payload) => {
      state.statusMap.enableCollateral = { loading: true };
    })
    .addCase(addCollateral.fulfilled, (state, { payload: { contract, token, amount, success } }) => {
      const escrow = state.collateralMap[contract] as AggregatedEscrow;
      const escrowDeposits = escrow.deposits ?? ({} as EscrowDepositMap);
      escrowDeposits[token].amount = BigNumber.from(escrowDeposits[token].amount).add(amount).toString();
      state.collateralMap[contract] = { ...escrow, deposits: escrowDeposits };
    })
    .addCase(addCollateral.rejected, (state, { error }) => {
      state.statusMap.enableCollateral = { error: error.message };
    })

    /* -------------------------------- releaseCollateral ------------------------------- */
    .addCase(releaseCollateral.pending, (state, payload) => {
      state.statusMap.enableCollateral = { loading: true };
    })
    .addCase(releaseCollateral.fulfilled, (state, { payload: { contract, token, amount, success } }) => {
      const escrow = state.collateralMap[contract] as AggregatedEscrow;
      const escrowDeposits = escrow.deposits ?? ({} as EscrowDepositMap);
      escrowDeposits[token].amount = BigNumber.from(escrowDeposits[token].amount).sub(amount).toString();
      state.collateralMap[contract] = { ...escrow, deposits: escrowDeposits };
    })
    .addCase(releaseCollateral.rejected, (state, { error }) => {
      state.statusMap.enableCollateral = { error: error.message };
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

    /* -------------------------------- deploySecuredLineWithConfig ------------------------------- */
    .addCase(deploySecuredLineWithConfig.fulfilled, (state, { payload: { lineAddress, lineObj, deployData } }) => {
      const { escrowId, spigotId } = lineObj;
      if (!lineAddress || !escrowId || !spigotId) return;
      const { cratio } = deployData;
      const escrow = {
        id: escrowId,
        cratio: '0',
        collateralValue: '0',
        // displays mincratio as a percentage rounded to 2 decimal places
        minCRatio: Math.round(100 * Number(cratio.toString())) / 100,
        deposits: {} as EscrowDepositMap,
        type: COLLATERAL_TYPE_ASSET,
        line: lineAddress,
      };
      const spigot = {
        id: spigotId,
        revenueValue: '0',
        revenueSummary: {} as RevenueSummaryMap,
        type: COLLATERAL_TYPE_REVENUE,
        line: lineAddress,
      };
      state.collateralMap = { ...state.collateralMap, [escrowId]: escrow, [spigotId]: spigot };
    })

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
    /* -------------------------------- reserves ------------------------------- */
    .addCase(
      tradeable.fulfilled,
      (state, { payload: { tokenAddressMap, spigotAddress, tokenPrices, tokenAddress, lineAddress } }) => {
        const map = { [tokenAddress]: tokenAddressMap };
        state.reservesMap = {
          ...state.reservesMap,
          [lineAddress]: { ...(state.reservesMap[lineAddress] || {}), ...map },
        };
        const spigot = state.collateralMap[spigotAddress.toLowerCase()] as AggregatedSpigot;
        const reserves = state.reservesMap[lineAddress];
        const updatedSpigot = formatCollateralRevenue(spigot, reserves, tokenPrices);
        state.collateralMap[spigotAddress.toLowerCase()] = updatedSpigot;
      }
    );
});

export default collateralReducer;
