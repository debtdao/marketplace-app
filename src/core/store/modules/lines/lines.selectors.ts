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
  BaseCreditLine,
  GetLinePageResponse,
  LineUserMetadata,
  Address,
  CreditLinePage, // prev. GeneralVaultView, Super indepth data, CreditLinePage is most similar atm
  PositionSummary,
  Spigot,
  CollateralEvent,
  CreditLineEvents,
  ModuleNames,
  SPIGOT_MODULE_NAME,
  ESCROW_MODULE_NAME,
} from '@types';
import { toBN } from '@utils';

import { createToken } from '../tokens/tokens.selectors';

import { initialLineActionsStatusMap } from './lines.reducer';

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
const selectLinesActionsStatusMap = (state: RootState) => state.lines.statusMap.user.linesActionsStatusMap;
const selectLinesStatusMap = (state: RootState) => state.lines.statusMap;
// const selectExpectedTxOutcome = (state: RootState) => state.lines.transaction.expectedOutcome;
// const selectExpectedTxOutcomeStatus = (state: RootState) => state.lines.statusMap.getExpectedTransactionOutcome;
const selectUserLinesSummary = (state: RootState) => state.lines.user.linePositions;

const selectGetLinesStatus = (state: RootState) => state.lines.statusMap.getLines;
const selectGetUserLinesPositionsStatus = (state: RootState) => state.lines.statusMap.user.getUserLinePositions;

/* ----------------------------- Main Selectors ----------------------------- */
const selectLines = createSelector(
  [
    selectLinesMap,
    selectLinesAddresses,
    selectUserLinesPositionsMap,
    // selectUserLinesMetadataMap,
    selectUserTokensMap,
    selectLinesAllowancesMap,
    selectUserTokensAllowancesMap,
  ],
  (
    linesMap,
    linesAddresses,
    linePositions,
    // userLinesMetadataMap,
    userTokensMap,
    lineAllowances, // NOTE: For now we are gonna get the allowance from TokenState.user.tokenAllowances[]
    userTokensAllowancesMap
  ) => {
    const lines = linesAddresses.map((address) => {
      const lineData = linesMap[address];
      // const positions = positions
      // const userTokenData = userTokensMap[lineData.tokenId];
      const tokenAllowancesMap = userTokensAllowancesMap[lineData.token] ?? {};
      const lineAllowancesMap = userTokensAllowancesMap[address] ?? {};
      const positions = Object.keys(linePositions)
        .filter((id) => lineData.activeIds.includes(id))
        .reduce((obj, id) => {
          return { ...obj, [id]: linePositions[id] };
        }, {});

      return createLine({
        lineData,
        // userTokenData,
        positions,
        // userLinesMetadataMap: userLinesMetadataMap[address],
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

const selectLiveLines = createSelector([selectLines], (lines): CreditLine[] => {
  return lines.filter((line: CreditLine) => line.end < Date.now() / 1000);
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
  // const stableLines: CreditLine[] = [];
  // stableCoinsSymbols.forEach((symbol) => {
  //   const line = lines.find((line) => line.token.symbol === symbol);
  //   if (!line) return;
  //   stableLines.push(line);
  // });

  // let max = toBN('0');
  // let stableLine: CreditLine = stableLines[0];
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
    selectUserLinesPositionsMap,
    // selectUserLinesMetadataMap,
    selectUserTokensMap,
    selectLinesAllowancesMap,
    selectUserTokensAllowancesMap,
  ],
  (
    linesMap,
    positions,
    // userLinesMetadataMap,
    userTokensMap,
    lineAllowances, // NOTE: For now we are gonna get the allowance from TokenState.user.tokenAllowances[]
    userTokensAllowancesMap
  ) =>
    memoize((lineAddress: string) => {
      const lineData = linesMap[lineAddress];
      if (!lineData) return undefined;
      // const tokenData = tokensMap[lineData.tokenId];
      // const positions = positions
      const userTokenData = userTokensMap[lineData.tokenId];
      const tokenAllowancesMap = userTokensAllowancesMap[lineData.token] ?? {};
      const lineAllowancesMap = userTokensAllowancesMap[lineAddress] ?? {};
      return createLine({
        lineData,
        tokenData,
        userTokenData,
        positions,
        // userLinesMetadataMap: userLinesMetadataMap[lineAddress],
        lineAllowancesMap,
        tokenAllowancesMap,
      });
    })
);

const selectUnderlyingTokensAddresses = createSelector([selectUserLinesPositionsMap], (lines): Address[] => {
  return Object.values(lines).map((line) => line.token);
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
  return lines.find((line) => line.id === selectedLineAddress);
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
interface CreateLineProps {
  lineData: BaseCreditLine;
  tokenAllowancesMap: AllowancesMap;
  positions: { [key: string]: PositionSummary };
  // userLinesMetadataMap: LineUserMetadata;
  lineAllowancesMap: AllowancesMap;
}
function createLine(props: CreateLineProps): CreditLine {
  const {
    lineData,
    tokenAllowancesMap,
    lineAllowancesMap,
    positions,
    // userLinesMetadataMap,
  } = props;

  return {
    ...lineData,
  };
}

interface CreateLinePageProps {
  lineData: GetLinePageResponse;
  tokenAllowancesMap: AllowancesMap;
  positions: { [key: string]: PositionSummary };
  // userLinesMetadataMap: LineUserMetadata;
  lineAllowancesMap: AllowancesMap;
}
function createLinePage(props: CreateLinePageProps): CreditLinePage {
  const {
    tokenAllowancesMap,
    lineData,
    lineAllowancesMap,
    positions,
    // userLinesMetadataMap,
  } = props;
  const lineAddress = lineData.id;
  const currentAllowance = tokenAllowancesMap[lineAddress] ?? '0';

  console.log('get lines category res: ', lineAddress, response.data);
  const { start, end, status, borrower, credits, spigot, escrow } = response.data;

  // dreivative or aggregated data we need to compute and store while mapping position data

  // position id and APY
  const highestApy: [string, number] = ['', 0];
  // aggregated revenue in USD by token across all spigots
  const tokenRevenue: { [key: string]: number } = {};
  const principal = 0;
  const interest = 0;

  //  all recent Spigot and Escrow events
  let collateralEvents: CollateralEvent[] = [];
  /**
   * @function
   * @name mergeCollateralEvents
   * @desc - takes all events for a single deposit/spigot and merges them into global list
   * @dev  - expects all events to be in the same token
   * @param type - the type of module used as collateral
   * @param symbol - the token in event
   * @param price - the price to use for events. Generally current price for escrow and time of event for spigot
   * @param events - the events to process
   */
  const mergeCollateralEvents = (type: ModuleNames, symbol: string, price: number = 0, events: CollateralEvent[]) => {
    let totalVal = 0;
    const newEvents: CollateralEvent[] = events.map((e: any): CollateralEvent => {
      const value = price * e.amount;
      if (type === SPIGOT_MODULE_NAME) {
        // aggregate token revenue. not needed for escrow bc its already segmented by token
        // use price at time of revenue for more accuracy
        tokenRevenue[symbol] += value;
      }
      totalVal += value;
      return {
        type,
        __typename: e.__typename,
        timestamp: e.timestamp,
        symbol: symbol || 'UNKNOWN',
        amount: e.amount,
        value,
      };
    });

    collateralEvents = [...collateralEvents, ...newEvents];
    return totalVal;
  };

  //  all recent borrow/lend events
  let creditEvents: CreditLineEvents[] = [];
  /**
   * @function
   * @name mergeCollateralEvents
   * @desc - takes all events for a single deposit/spigot and merges them into global list
   * @dev  - expects all events to be in the same token
   * @param type - the type of module used as collateral
   * @param symbol - the token in event
   * @param price - the price to use for events. Generally current price for escrow and time of event for spigot
   * @param events - the events to process
   */
  const mergeCreditEvents = (symbol: string, price: number = 0, events: CreditLineEvents[]) => {
    const newEvents: CreditLineEvents[] = events.map((e: any): CreditLineEvents => {
      const { id, __typename, amount, timestamp, value: val } = e;
      let value = amount * price;
      if (__typename === 'InterestRepaidEvent') {
        // only use value at time of repayment for repayment events
        // use current price for all other events
        value = val;
      }

      return {
        id,
        __typename,
        timestamp,
        symbol: symbol || 'UNKNOWN',
        amount,
        value,
      };
    });

    // TODO promise.all token price fetching for better performance

    creditEvents = [...creditEvents, ...newEvents];
  };

  const pageData: CreditLinePage = {
    // metadata
    id: lineAddress as Address,
    start,
    end,
    status,
    borrower,
    // debt data
    principal,
    interest,
    credits: credits.reduce((obj: any, c: any) => {
      const { deposit, drawnRate, id, lender, symbol, events, principal, interest, interestRepaid, token } = c;
      // const currentPrice = await fetchTokenPrice(symbol, Date.now())
      const currentPrice = 1e8;
      mergeCreditEvents(c.token.symbol, currentPrice, events);
      return {
        ...obj,
        [id]: {
          id,
          lender,
          deposit,
          drawnRate,
          principal,
          interest,
          interestRepaid,
          token,
        },
      };
    }),
    // collateral data
    spigot: spigot?.id
      ? undefined
      : {
          revenue: tokenRevenue,
          spigots: spigot.spigots.reduce((obj: any, s: any): { [key: string]: Spigot } => {
            const {
              id,
              token: { symbol, lastPriceUSD },
              active,
              contract,
              startTime,
              events,
            } = s;
            mergeCollateralEvents(SPIGOT_MODULE_NAME, symbol, lastPriceUSD, events); // normalize and save events
            return { ...obj, [id]: { active, contract, symbol, startTime, lastPriceUSD } };
          }, {}),
        },
    escrow: escrow?.id
      ? undefined
      : {
          deposits: escrow.deposits.reduce((obj: any, d: any) => {
            const {
              id,
              amount,
              enabled,
              token: { symbol },
              events,
            } = d;
            // TODO promise.all token price fetching for better performance
            // const currentUsdPrice = await fetchTokenPrice(symbol, Datre.now());
            const currentUsdPrice = 1e8;
            mergeCollateralEvents(ESCROW_MODULE_NAME, symbol, currentUsdPrice, events); // normalize and save events
            return { ...obj, [id]: { symbol, currentUsdPrice, amount, enabled } };
          }, {}),
        },
    // all recent events
    collateralEvents,
    creditEvents,
  };

  return pageData;
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
