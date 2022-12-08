import _ from 'lodash';
import { createReducer } from '@reduxjs/toolkit';
import { ethers } from 'ethers';

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
} from '@types';

import { LinesActions } from './lines.actions';

export const initialLineActionsStatusMap: LineActionsStatusMap = {
  get: initialStatus,
  approve: initialStatus,
  deposit: initialStatus,
  withdraw: initialStatus,
};

export const initialUserMetadataStatusMap: UserLineMetadataStatusMap = {
  getUserPortfolio: initialStatus,
  linesActionsStatusMap: {},
};

export const linesInitialState: CreditLineState = {
  selectedLineAddress: undefined,
  selectedPosition: undefined,
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
  // initiateSaveLines,
  setSelectedLineAddress,
  setSelectedLinePosition,
  setPosition,
  getUserLinePositions,
  getUserPortfolio,
  clearLinesData,
  clearUserData,
  // getUserLinesMetadata,
  clearSelectedLineAndStatus,
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
      state.selectedPosition = position;
    })

    .addCase(setPosition, (state, { payload: { id, position } }) => {
      state.positionsMap[id] = position;
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

    .addCase(clearSelectedLineAndStatus, (state) => {
      if (!state.selectedLineAddress) return;
      //const currentAddress = state.selectedLineAddress;
      // state.statusMap.linesActionsStatusMap[currentAddress] = initialLineActionsStatusMap;
      state.selectedLineAddress = undefined;
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

      // loop over nested structure of new Lines and update state
      Object.entries(linesData).map(([category, ls]) =>
        ls?.map((l) => {
          lines[l.id] = l;
          state.statusMap.user.linesActionsStatusMap[l.id] = initialLineActionsStatusMap;
          // save line id to category for reference
          categories[category] = [...(categories[category] || []), l.id];
        })
      );
      // merge new lines with old
      state.linesMap = { ...state.linesMap, ...lines };

      // merge new categories with old
      state.categories = { ...state.categories, ...categories };
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
        const { positions, collateralEvents, creditEvents, ...metadata } = linePageData;
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

    /* ------------------------- getUserPortfolio ------------------------- */
    .addCase(getUserPortfolio.pending, (state, { meta }) => {
      state.statusMap.user.getUserPortfolio = { loading: true };
    })
    .addCase(getUserPortfolio.fulfilled, (state, { meta, payload: { address, lines, positions } }) => {
      state.linesMap = { ...state.linesMap, ...lines };
      const linesByRole: LinesByRole = _.entries<SecuredLine>(lines).reduce(
        ({ borrowing, arbiting }: LinesByRole, [addy, line]) => {
          if (line.borrower === address) return { arbiting, borrowing: [...borrowing, addy] };
          if (line.arbiter === address) return { borrowing, arbiting: [...arbiting, addy] };
          return { borrowing, arbiting };
        },
        { borrowing: [], arbiting: [] }
      );

      // if ( positions ) {
      // state.positions = {
      //   ...state.positionsMap,
      //   ...positions,
      // }
      // }
      state.user.portfolio = {
        borrowerLineOfCredits: linesByRole.borrowing,
        lenderPositions: _.values(positions),
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

    .addCase(addCredit.pending, (state) => {
      state.statusMap.getAllowances = { loading: true };
    })
    .addCase(addCredit.fulfilled, (state) => {
      // deployLine action emits a getLine action if tx is successful
      state.statusMap.getAllowances = {};
    })
    .addCase(addCredit.rejected, (state, { error }) => {
      state.statusMap.getAllowances = { error: error.message };
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
