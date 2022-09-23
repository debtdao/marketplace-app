import { createSelector } from '@reduxjs/toolkit';
import { memoize } from 'lodash';

import {
  RootState,
  Status,
  LineActionsStatusMap,
  CreditLine,
  Token,
  Balance,
  AllowancesMap,
  LinePositionsMap,
  LineUserMetadata,
  Address,
  CreditLinePage, // prev. GeneralVaultView, Super indepth data, CreditLinePage is most similar atm
  PositionSummary,
} from '@types';
import { toBN } from '@utils';

import { createToken } from '../tokens/tokens.selectors';

import { initiaLinesActionsStatusMap } from './lines.reducer';

/* ---------------------------------- State --------------------------------- */
const selectLinesState = (state: RootState) => state.lines;
const selectUserLinesPositionsMap = (state: RootState) => state.lines.user.linePositions;
// const selectUserLinesMetadataMap = (state: RootState) => state.lines.user.userLinesMetadataMap;
const selectLinesMap = (state: RootState) => state.lines.linesMap;
const selectLinesAddresses = (state: RootState) => Object.keys(state.lines.linesMap);
const selectUserTokensMap = (state: RootState) => state.tokens.user.userTokensMap;
const selectUserTokensAllowancesMap = (state: RootState) => state.tokens.user.userTokensAllowancesMap;
const selectLinesAllowancesMap = (state: RootState) => state.lines.user.lineAllowances;
const selectTokensMap = (state: RootState) => state.tokens.tokensMap;
const selectSelectedLineAddress = (state: RootState) => state.lines.selectedLineAddress;
const selectLinesActionsStatusMap = (state: RootState) => state.lines.statusMap.linesActionsStatusMap;
const selectLinesStatusMap = (state: RootState) => state.lines.statusMap;
// const selectExpectedTxOutcome = (state: RootState) => state.lines.transaction.expectedOutcome;
// const selectExpectedTxOutcomeStatus = (state: RootState) => state.lines.statusMap.getExpectedTransactionOutcome;
const selectUserLinesSummary = (state: RootState) => state.lines.user.linePositions;

const selectGetLinesStatus = (state: RootState) => state.lines.statusMap.getLines;
const selectGetUserLinesPositionsStatus = (state: RootState) => state.lines.statusMap.user.getUserLinesPositions;

/* ----------------------------- Main Selectors ----------------------------- */
const selectLines = createSelector(
  [
    selectLinesMap,
    selectLinesAddresses,
    selectTokensMap,
    selectUserLinesPositionsMap,
    selectUserLinesMetadataMap,
    selectUserTokensMap,
    selectLinesAllowancesMap,
    selectUserTokensAllowancesMap,
  ],
  (
    linesMap,
    linesAddresses,
    tokensMap,
    linePositions,
    userLinesMetadataMap,
    userTokensMap,
    lineAllowances, // NOTE: For now we are gonna get the allowance from TokenState.user.tokenAllowances[]
    userTokensAllowancesMap
  ) => {
    const lines = linesAddresses.map((address) => {
      const lineData = linesMap[address];
      const tokenData = tokensMap[lineData.tokenId];
      const userTokenData = userTokensMap[lineData.tokenId];
      const tokenAllowancesMap = userTokensAllowancesMap[lineData.token] ?? {};
      const lineAllowancesMap = userTokensAllowancesMap[address] ?? {};
      return createLinePage({
        lineData,
        tokenData,
        userTokenData,
        userLinePositionsMap: linePositions[address],
        userLinesMetadataMap: userLinesMetadataMap[address],
        lineAllowancesMap,
        tokenAllowancesMap,
      });
    });

    lines.sort((a, b) => {
      return toBN(b.token.balance).minus(a.token.balance).toNumber();
    });
    return lines;
  }
);

const selectLiveLines = createSelector([selectLines], (lines): CreditLinePage[] => {
  return lines.filter((line: CreditLinePage) => !line.hideIfNoDeposits);
});

// Not needed yet. TODO: Select all past-term lines
// const selectDeprecatedLines = createSelector([selectLines], (lines): PositionSummary[] => {
//   const deprecatedLines = lines
//     .filter((line) => line.hideIfNoDeposits)
//     .map(({ DEPOSIT, token, ...rest }) => ({ token, ...DEPOSIT, ...rest }));
//   return deprecatedLines.filter((line) => toBN(line.userDeposited).gt(0));
// });

const selectDepositedLines = createSelector([selectLiveLines], (lines): PositionSummary[] => {
  const depositLines = lines.map(({ DEPOSIT, token, ...rest }) => ({ token, ...DEPOSIT, ...rest }));
  return depositLines.filter((line) => toBN(line.userDeposited).gt(0));
});

const selectLinesOpportunities = createSelector([selectLiveLines], (lines): PositionSummary[] => {
  const depositLines = lines.map(({ DEPOSIT, token, ...rest }) => ({ token, ...DEPOSIT, ...rest }));
  const opportunities = depositLines.filter((line) => toBN(line.userDeposited).lte(0));
  return opportunities;
});

const selectSelectedLineActionsStatusMap = createSelector(
  [selectLinesActionsStatusMap, selectSelectedLineAddress],
  (linesActionsStatusMap, selectedLineAddress): LineActionsStatusMap => {
    return selectedLineAddress ? linesActionsStatusMap[selectedLineAddress] : initialLineActionsStatusMap;
  }
);

const selectSummaryData = createSelector([selectUserLinesSummary], (userLinesSummary) => {
  return {
    totalDeposits: userLinesSummary?.holdings ?? '0',
    totalEarnings: userLinesSummary?.earnings ?? '0',
    estYearlyYeild: userLinesSummary?.estimatedYearlyYield ?? '0',
    apy: userLinesSummary?.grossApy.toString() ?? '0',
  };
});

const selectRecommendations = createSelector([selectLiveLines], (lines) => {
  // const stableCoinsSymbols = ['DAI', 'USDC', 'USDT', 'sUSD'];
  // const stableLines: CreditLinePage[] = [];
  // stableCoinsSymbols.forEach((symbol) => {
  //   const line = lines.find((line) => line.token.symbol === symbol);
  //   if (!line) return;
  //   stableLines.push(line);
  // });

  // let max = toBN('0');
  // let stableLine: CreditLinePage = stableLines[0];
  // stableLines.forEach((line) => {
  //   if (max.gte(line.apyData)) return;
  //   max = toBN(line.apyData);
  //   stableLine = line;
  // });

  // const derivativeLines = differenceBy(lines, stableLines, 'address');

  // derivativeLines.sort((a, b) => {
  //   return toBN(b.apyData).minus(a.apyData).toNumber();
  // });

  // return [stableLine, derivativeLines[1], derivativeLines[0]].filter((item) => !!item);
  const sortedLines = [...lines].sort((a, b) => {
    return toBN(b.apyData).minus(a.apyData).toNumber();
  });
  return sortedLines.slice(0, 3);
});

const selectLine = createSelector(
  [
    selectLinesMap,
    selectTokensMap,
    selectUserLinesPositionsMap,
    selectUserLinesMetadataMap,
    selectUserTokensMap,
    selectLinesAllowancesMap,
    selectUserTokensAllowancesMap,
  ],
  (
    linesMap,
    tokensMap,
    linePositions,
    userLinesMetadataMap,
    userTokensMap,
    lineAllowances, // NOTE: For now we are gonna get the allowance from TokenState.user.tokenAllowances[]
    userTokensAllowancesMap
  ) =>
    memoize((lineAddress: string) => {
      const lineData = linesMap[lineAddress];
      if (!lineData) return undefined;
      const tokenData = tokensMap[lineData.tokenId];
      const userTokenData = userTokensMap[lineData.tokenId];
      const tokenAllowancesMap = userTokensAllowancesMap[lineData.token] ?? {};
      const lineAllowancesMap = userTokensAllowancesMap[lineAddress] ?? {};
      return createLinePage({
        lineData,
        tokenData,
        userTokenData,
        userLinePositionsMap: linePositions[lineAddress],
        userLinesMetadataMap: userLinesMetadataMap[lineAddress],
        lineAllowancesMap,
        tokenAllowancesMap,
      });
    })
);

const selectUnderlyingTokensAddresses = createSelector([selectLinesMap], (lines): Address[] => {
  return Object.values(lines).map((line) => line.tokenId);
});

/* -------------------------------- Statuses -------------------------------- */
const selectLinesGeneralStatus = createSelector([selectLinesStatusMap], (statusMap): Status => {
  const loading = statusMap.getLines.loading || statusMap.initiateSaveLines.loading;
  const error = statusMap.getLines.error || statusMap.initiateSaveLines.error;
  return { loading, error };
});

const selectSelectedLine = createSelector([selectLines, selectSelectedLineAddress], (lines, selectedLineAddress) => {
  if (!selectedLineAddress) {
    return undefined;
  }
  return lines.find((line) => line.address === selectedLineAddress);
});

const selectLinesStatus = createSelector(
  [selectGetLinesStatus, selectGetUserLinesPositionsStatus],
  (getLinesStatus, getUserLinesPositionsStatus): Status => {
    return {
      loading: getLinesStatus.loading || getUserLinesPositionsStatus.loading,
      error: getLinesStatus.error || getUserLinesPositionsStatus.error,
    };
  }
);

/* --------------------------------- Helper --------------------------------- */
interface CreateLinePageProps {
  lineData: CreditLinePage;
  tokenAllowancesMap: AllowancesMap;
  userLinePositionsMap: LinePositionsMap;
  userLinesMetadataMap: LineUserMetadata;
  lineAllowancesMap: AllowancesMap;
}

function createLinePage(props: CreateLinePageProps): CreditLinePage {
  const { tokenAllowancesMap, lineData, lineAllowancesMap, userLinePositionsMap, userLinesMetadataMap } = props;
  const lineAddress = lineData.id;
  const currentAllowance = tokenAllowancesMap[lineAddress] ?? '0';

  return {};
}

export const LinesSelectors = {
  selectLinesState,
  selectLinesMap,
  selectLines,
  selectLiveLines,
  // selectDeprecatedLines,
  selectUserLinesPositionsMap,
  selectUserTokensMap,
  selectTokensMap,
  selectSelectedLineAddress,
  selectLinesActionsStatusMap,
  selectLinesStatusMap,
  selectLinesGeneralStatus,
  selectSelectedLine,
  selectSelectedLineActionsStatusMap,
  selectDepositedLines,
  selectLinesOpportunities,
  selectSummaryData,
  selectRecommendations,
  selectLinesStatus,
  selectLine,
  // selectExpectedTxOutcome,
  // selectExpectedTxOutcomeStatus,
  selectUnderlyingTokensAddresses,
};
