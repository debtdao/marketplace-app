import { createReducer } from '@reduxjs/toolkit';
import { union } from 'lodash';

import { CreditLineState, initialStatus } from '@types';

import { CreditLinesActions } from './creditLines.actions';

export const creditLinesInitialState: CreditLineState = {
  creditLinesAddresses: [],
  creditLinesMap: {},
  selectedCreditLineAddress: undefined,
  creditLine: undefined,
  statusMap: {
    getCreditLines: { ...initialStatus },
    addCredit: { ...initialStatus },
  },
};

const { setSelectedCreditLineAddress, getCreditLines, clearSelectedCreditLine, clearCreditLinesData, addCredit } =
  CreditLinesActions;

const creditLinesReducer = createReducer(creditLinesInitialState, (builder) => {
  builder

    /* -------------------------------------------------------------------------- */
    /*                                   Setters                                  */
    /* -------------------------------------------------------------------------- */
    .addCase(setSelectedCreditLineAddress, (state, { payload: { creditLineAddress } }) => {
      state.selectedCreditLineAddress = creditLineAddress;
    })

    /* -------------------------------------------------------------------------- */
    /*                                 Clear State                                */
    /* -------------------------------------------------------------------------- */
    .addCase(clearCreditLinesData, (state) => {
      state.creditLinesMap = {};
      state.creditLinesAddresses = [];
    })
    .addCase(clearSelectedCreditLine, (state) => {
      state.creditLine = undefined;
    })

    /* -------------------------------------------------------------------------- */
    /*                                 Fetch Data                                 */
    /* -------------------------------------------------------------------------- */

    /* -------------------------------- getTokens ------------------------------- */
    .addCase(getCreditLines.pending, (state) => {
      state.statusMap.getCreditLines = { loading: true };
    })
    .addCase(getCreditLines.fulfilled, (state, { payload: { creditLinesData } }) => {
      const tokenAddresses: string[] = [];
      creditLinesData.forEach((creditLine) => {
        state.creditLinesMap[creditLine.id] = creditLine;
        tokenAddresses.push(creditLine.id);
      });
      state.creditLinesAddresses = union(state.creditLinesAddresses, tokenAddresses);
      state.statusMap.getCreditLines = {};
    })

    /* -------------------------------------------------------------------------- */
    /*                                Transactions                                */
    /* -------------------------------------------------------------------------- */

    /* -------------------------------- addCredit ------------------------------- */
    .addCase(addCredit.pending, (state) => {
      state.statusMap.addCredit = { loading: true };
    })
    .addCase(addCredit.rejected, (state, { error }) => {
      state.statusMap.addCredit = {
        loading: false,
        error: error.message,
      };
    })
    .addCase(addCredit.fulfilled, (state) => {
      state.statusMap.addCredit = {};
    });

  /* --------------------------------- approve -------------------------------- */
  // Note: approve pending/rejected statuses are handled on each asset (vault/ironbank/...) approve action.
  // .addCase(approve.fulfilled, (state, { meta, payload: { amount } }) => {
  //   const { tokenAddress, spenderAddress } = meta.arg;
  //   state.user.userTokensAllowancesMap[tokenAddress] = {
  //     ...state.user.userTokensAllowancesMap[tokenAddress],
  //     [spenderAddress]: amount,
  //   };
  // });
});

export default creditLinesReducer;
