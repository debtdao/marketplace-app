import _ from 'lodash';
import { createReducer } from '@reduxjs/toolkit';
import { BigNumber, ethers } from 'ethers';

import {
  initialStatus,
  CreditLineState,
  UserLineMetadataStatusMap,
  LineActionsStatusMap,
  SecuredLine,
  CreditPosition,
  BORROWER_POSITION_ROLE,
  Address,
  LinesByRole,
  PositionMap,
  CreditEvent,
  CreditProposal,
  EscrowDeposit,
  EscrowDepositMap,
  ProposalMap,
  PROPOSED_STATUS,
  LineOfCredit,
  ACTIVE_STATUS,
  RevenueSummaryMap,
} from '@types';
import { BASE_DECIMALS, formatOptimisticProposal, getNetworkId } from '@src/utils';

import { NetworkActions } from '../network/network.actions';
import { WalletActions } from '../wallet/wallet.actions';
import { CollateralActions } from '../collateral/collateral.actions';

import { LinesActions } from './lines.actions';

export const initialLineActionsStatusMap: LineActionsStatusMap = {
  get: initialStatus,
  approve: initialStatus,
  deposit: initialStatus,
  withdraw: initialStatus,
};

const { networkChange } = WalletActions;

const { changeNetwork } = NetworkActions;

export const initialUserMetadataStatusMap: UserLineMetadataStatusMap = {
  getUserPortfolio: initialStatus,
  linesActionsStatusMap: {},
};

export const linesInitialState: CreditLineState = {
  selectedLineAddress: undefined,
  selectedPosition: undefined,
  selectedProposal: undefined,
  linesMap: {},
  positionsMap: {},
  eventsMap: {},
  categories: {},
  user: {
    linePositions: {},
    lineAllowances: {},
    portfolio: {
      borrowerLineOfCredits: [],
      lenderPositions: [],
      arbiterLineOfCredits: [],
    },
  },
  statusMap: {
    addCredit: initialStatus,
    getLines: initialStatus,
    getLine: initialStatus,
    getLinePage: initialStatus,
    getAllowances: initialStatus,
    getUserPortfolio: initialStatus,
    deploySecuredLine: initialStatus,
    user: initialUserMetadataStatusMap,
  },
};

const {
  addCredit,
  approveDeposit,
  depositAndRepay,
  // approveZapOut,
  // signZapOut,
  withdrawLine,
  // migrateLine,
  getLine,
  getLinePage,
  getLines,
  deploySecuredLine,
  deploySecuredLineWithConfig,
  // initiateSaveLines,
  setSelectedLineAddress,
  setSelectedLinePosition,
  setSelectedLinePositionProposal,
  setPosition,
  revokeProposal,
  getUserLinePositions,
  getUserPortfolio,
  clearLinesData,
  clearUserData,
  // getUserLinesMetadata,
  clearSelectedLine,
  clearLineStatus,
} = LinesActions;

const linesReducer = createReducer(linesInitialState, (builder) => {
  builder

    /* -------------------------------------------------------------------------- */
    /*                                   Setters                                  */
    /* -------------------------------------------------------------------------- */
    .addCase(setSelectedLineAddress, (state, { payload: { lineAddress } }) => {
      state.selectedLineAddress = lineAddress;
    })

    .addCase(setSelectedLinePosition, (state, { payload: { position } }) => {
      console.log('set position', position, state.positionsMap[position ?? ''], state.positionsMap);
      state.selectedPosition = position;
    })

    .addCase(setSelectedLinePositionProposal, (state, { payload: { position, proposal } }) => {
      state.selectedProposal = proposal;
    })

    .addCase(setPosition, (state, { payload: { id, position } }) => {
      state.positionsMap[id] = position;
      console.log('Updated Positions Map: ', state.positionsMap[id]);
    })

    .addCase(revokeProposal, (state, { payload: { lineAddress, positionId, proposalId } }) => {
      const { revokedAt, ...rest } = state.positionsMap[positionId]?.proposalsMap[proposalId];
      const updatedProposal = { ...rest, revokedAt: 1234 }; // TODO: replace with actual time the proposal was revoked
      state.positionsMap[positionId].proposalsMap[proposalId] = updatedProposal;
    })
    /* -------------------------------------------------------------------------- */
    /*                                 Clear State                                */
    /* -------------------------------------------------------------------------- */
    .addCase(clearLinesData, (state) => {
      state.linesMap = {};
    })
    .addCase(clearUserData, (state) => {
      state.user.linePositions = {};
      state.user.lineAllowances = {};
      state.user.portfolio = {
        borrowerLineOfCredits: [],
        lenderPositions: [],
        arbiterLineOfCredits: [],
      };
    })

    // .addCase(clearTransactionData, (state) => {
    //   state.statusMap.getExpectedTransactionOutcome = {};
    // })

    .addCase(clearSelectedLine, (state) => {
      if (!state.selectedLineAddress) return;
      state.selectedLineAddress = undefined;
      state.selectedPosition = undefined;
    })

    .addCase(clearLineStatus, (state, { payload: { lineAddress } }) => {
      // state.statusMap.linesActionsStatusMap[lineAddress] = initialLineActionsStatusMap;
    })

    /* -------------------------------------------------------------------------- */
    /*                                 Fetch data                                 */
    /* -------------------------------------------------------------------------- */

    /* --------------------------- initiateSaveLines --------------------------- */
    // .addCase(initiateSaveLines.pending, (state) => {
    //   state.statusMap.initiateSaveLines = { loading: true };
    // })
    // .addCase(initiateSaveLines.fulfilled, (state) => {
    //   state.statusMap.initiateSaveLines = {};
    // })
    // .addCase(initiateSaveLines.rejected, (state, { error }) => {
    //   state.statusMap.initiateSaveLines = { error: error.message };
    // })
    /* -------------------------------- getLine ------------------------------- */
    .addCase(getLine.pending, (state) => {
      state.statusMap.getLine = { loading: true };
    })
    .addCase(getLine.fulfilled, (state, { payload: { lineData } }) => {
      if (lineData) {
        state.linesMap = { ...state.linesMap, [lineData.id]: lineData };
      }
      state.statusMap.getLine = {};
    })
    .addCase(getLine.rejected, (state, { error }) => {
      state.statusMap.getLine = { error: error.message };
    })
    /* -------------------------------- getLines ------------------------------- */
    .addCase(getLines.pending, (state) => {
      // either need to make linesData in .fullfilled be a map like request
      state.statusMap.getLines = { loading: true };
    })
    .addCase(getLines.fulfilled, (state, { payload: { linesData } }) => {
      // reset status
      state.statusMap.getLines = {};

      const categories: { [key: string]: string[] } = {};
      const lines: { [key: string]: SecuredLine } = {};
      let positions: PositionMap = {};

      // loop over nested structure of new Lines and update state
      Object.entries(linesData).map(([category, ls]) =>
        ls?.map((line) => {
          lines[line.id] = line;
          // update positions for each line
          const linePositionMap = _.zipObject(_.values(line.positionIds), _.values(line.positions));
          positions = { ...positions, ...linePositionMap };
          state.statusMap.user.linesActionsStatusMap[line.id] = initialLineActionsStatusMap;
          // save line id to category for reference
          categories[category] = [...(categories[category] || []), line.id];
        })
      );
      const highestCreditLines = _.map(
        _.sortBy(lines, (line) => Number(BigNumber.from(line.deposit).div(BASE_DECIMALS)))
          .reverse()
          .slice(0, 3),
        'id'
      );
      const highestCreditLinesCategory = { 'market:featured.highest-credit': highestCreditLines };

      const highestRevenueLines = _.map(
        _.sortBy(lines, (line) => Number(BigNumber.from(line!.spigot!.revenueValue).div(BASE_DECIMALS)))
          .reverse()
          .slice(0, 3),
        'id'
      );
      console.log('Highest Revenue Lines: ', highestRevenueLines);

      const highestRevenueLinesCategory = { 'market:featured.highest-revenue': highestRevenueLines };

      const updatedCategories = { ...categories, ...highestCreditLinesCategory, ...highestRevenueLinesCategory };
      console.log('Categories: ', categories);
      console.log('Updated Categories: ', updatedCategories);
      // Remove spigot and escrow objects from lines
      const formattedLines = _.mapValues(lines, (line) => {
        const { spigot, escrow, ...rest } = line;
        return rest;
      });

      state.linesMap = { ...state.linesMap, ...formattedLines };
      state.positionsMap = { ...state.positionsMap, ...positions };
      state.categories = { ...state.categories, ...updatedCategories };
    })
    .addCase(getLines.rejected, (state, { error }) => {
      state.statusMap.getLines = { error: error.message };
    })
    /* -------------------------------- getLinePage ------------------------------- */
    .addCase(getLinePage.pending, (state) => {
      state.statusMap.getLinePage = { loading: true };
    })
    .addCase(getLinePage.fulfilled, (state, { payload: { linePageData } }) => {
      if (linePageData) {
        // overwrite actual positions with referential ids
        const { positions, creditEvents, ...metadata } = linePageData;
        state.linesMap = { ...state.linesMap, [linePageData.id]: { ...metadata } };
        state.positionsMap = { ...state.positionsMap, ...positions };
        state.eventsMap = { ...state.eventsMap, [metadata.id]: creditEvents };
        // we also update state.collateral on this action  being fullfilled in collateral.reducer.ts
      }

      state.statusMap.getLinePage = {};
    })
    .addCase(getLinePage.rejected, (state, { error }) => {
      state.statusMap.getLinePage = { error: error.message };
    })
    /* -------------------------------- deploySecuredLine ------------------------------- */
    .addCase(deploySecuredLine.pending, (state) => {
      state.statusMap.deploySecuredLine = { loading: true };
    })
    .addCase(deploySecuredLine.fulfilled, (state) => {
      // deployLine action emits a getLine action if tx is successful

      state.statusMap.deploySecuredLine = {};
    })
    .addCase(deploySecuredLine.rejected, (state, { error }) => {
      state.statusMap.deploySecuredLine = { error: error.message };
    })

    /* ------------------- ------ getUserPortfolio ------------------------- */
    .addCase(getUserPortfolio.pending, (state, { meta }) => {
      state.statusMap.user.getUserPortfolio = { loading: true };
    })
    .addCase(getUserPortfolio.fulfilled, (state, { meta, payload: { address, lines, lenderPositions } }) => {
      state.linesMap = { ...state.linesMap, ...lines };
      let allPositions = {};
      let allEvents = {};
      const linesByRole: LinesByRole = _.entries<SecuredLine>(lines).reduce(
        ({ borrowing, arbiting }: LinesByRole, [addy, line]) => {
          // add borrower and arbiter positions to object for state.positionsMap
          allPositions = { ...allPositions, ...(line.positions || {}) };

          if (line.borrower === address) return { arbiting, borrowing: [...borrowing, addy] };
          if (line.arbiter === address) return { borrowing, arbiting: [...arbiting, addy] };
          // allEvents = { ...allEvents, ...line.events }; TODO return events from tight
          return { borrowing, arbiting };
        },
        { borrowing: [], arbiting: [] }
      );
      // add lender positions to object for state.positionsMap and update state.positionsMap
      allPositions = { ...allPositions, ...lenderPositions };
      state.positionsMap = { ...state.positionsMap, ...allPositions };

      state.user.portfolio = {
        borrowerLineOfCredits: linesByRole.borrowing,
        lenderPositions: _.keys(lenderPositions),
        arbiterLineOfCredits: linesByRole.arbiting,
      };
    })
    .addCase(getUserPortfolio.rejected, (state, { meta, error }) => {
      state.statusMap.user.getUserPortfolio = { error: error.message };
    })

    /* ---------------------- getExpectedTransactionOutcome --------------------- */
    // .addCase(getExpectedTransactionOutcome.pending, (state) => {
    //   state.transaction = initialTransaction;
    //   state.statusMap.getExpectedTransactionOutcome = { loading: true };
    // })
    // .addCase(getExpectedTransactionOutcome.fulfilled, (state, { payload: { txOutcome } }) => {
    //   state.transaction.expectedOutcome = txOutcome;
    //   state.statusMap.getExpectedTransactionOutcome = {};
    // })
    // .addCase(getExpectedTransactionOutcome.rejected, (state, { error }) => {
    //   state.statusMap.getExpectedTransactionOutcome = { error: error.message };
    // })

    /* -------------------------------------------------------------------------- */
    /*                                Transactions                                */
    /* -------------------------------------------------------------------------- */

    /* ----------------------------- approveDeposit ----------------------------- */
    .addCase(approveDeposit.pending, (state) => {
      state.statusMap.getAllowances = { loading: true };
    })
    .addCase(approveDeposit.fulfilled, (state) => {
      // deployLine action emits a getLine action if tx is successful

      state.statusMap.getAllowances = {};
    })
    .addCase(approveDeposit.rejected, (state, { error }) => {
      state.statusMap.getAllowances = { error: error.message };
    })

    /* ----------------------------- addCredit ----------------------------- */
    .addCase(addCredit.pending, (state) => {
      state.statusMap.addCredit = { loading: true };
    })
    .addCase(addCredit.fulfilled, (state, { payload: { maker, transactionType, position } }) => {
      if (transactionType === 'propose') {
        const { lineAddress } = position;
        const positionId = '0x' + Math.random().toFixed(64).slice(2, 68);
        const positionIds = state.linesMap[lineAddress].positionIds ?? [];
        positionIds.push(positionId);
        const proposedPosition = formatOptimisticProposal(maker, position, positionId);
        state.linesMap[lineAddress].positionIds = positionIds;
        state.positionsMap[positionId] = proposedPosition;
      }
    })
    .addCase(addCredit.rejected, (state, { error }) => {
      state.statusMap.addCredit = { error: error.message };
    })

    /* ------------------------------ depositAndRepay ------------------------------ */
    .addCase(depositAndRepay.pending, (state, { meta }) => {
      //const lineAddress = meta.arg.lineAddress;
      console.log('state', state);
      //state.statusMap.user.linesActionsStatusMap[lineAddress].deposit = { loading: true };
    })
    .addCase(depositAndRepay.fulfilled, (state, { meta }) => {
      //const lineAddress = meta.arg.lineAddress;
      console.log('state', state);
      //state.statusMap.user.linesActionsStatusMap[lineAddress].deposit = {};
    })
    .addCase(depositAndRepay.rejected, (state, { error, meta }) => {
      //const lineAddress = meta.arg.lineAddress;
      console.log('error', error);
      //state.statusMap.user.linesActionsStatusMap[lineAddress].deposit = { error: error.message };
    })

    /* ------------------------------ deploySecuredLineWithConfig ------------------------------ */
    .addCase(deploySecuredLineWithConfig.pending, (state, { meta }) => {
      console.log('state', state);
    })
    .addCase(deploySecuredLineWithConfig.fulfilled, (state, { payload: { lineAddress, lineObj, deployData } }) => {
      const categories = state.categories;
      const newestFeatured = [lineAddress].concat(categories['market:featured.newest']);
      state.linesMap[lineAddress] = lineObj;
      state.categories['market:featured.newest'] = newestFeatured;
    })
    .addCase(deploySecuredLineWithConfig.rejected, (state, { error, meta }) => {
      console.log('error', error);
    })

    /* ------------------------------ withdrawLine ----------------------------- */
    .addCase(withdrawLine.pending, (state, { meta }) => {
      //const lineAddress = meta.arg.lineAddress;
      //state.statusMap.user.linesActionsStatusMap[lineAddress].withdraw = { loading: true };
      state.statusMap.getAllowances = { loading: true };
    })
    .addCase(withdrawLine.fulfilled, (state, { meta }) => {
      //const lineAddress = meta.arg.lineAddress;
      //state.statusMap.user.linesActionsStatusMap[lineAddress].withdraw = {};
      state.statusMap.getAllowances = { loading: true };
    })
    .addCase(withdrawLine.rejected, (state, { error, meta }) => {
      //const lineAddress = meta.arg.lineAddress;
      //state.statusMap.user.linesActionsStatusMap[lineAddress].withdraw = { error: error.message };
      state.statusMap.getAllowances = { loading: true };
    });
});

// old yearn code
// function parsePositionsIntoMap(positions: Position[]): { [lineAddress: string]: LinePositionsMap } {
//   const grouped = groupBy(positions, 'assetAddress');
//   const linesMap: { [lineAddress: string]: any } = {};
//   Object.entries(grouped).forEach(([key, value]) => {
//     linesMap[key] = keyBy(value, 'typeId');
//   });
//   return linesMap;
// }

function checkAndInitUserLineStatus(state: CreditLineState, lineAddress: string) {
  const actionsMap = state.statusMap.user.linesActionsStatusMap[lineAddress];
  if (actionsMap) return;
  state.statusMap.user.linesActionsStatusMap[lineAddress] = { ...initialLineActionsStatusMap };
}

export default linesReducer;
