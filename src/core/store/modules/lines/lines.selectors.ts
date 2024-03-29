import { createSelector } from '@reduxjs/toolkit';
import { memoize, find } from 'lodash';
import { getAddress } from '@ethersproject/address';
import _ from 'lodash';

import {
  RootState,
  Status,
  LineActionsStatusMap,
  SecuredLine,
  SecuredLineWithEvents,
  UserPositionMetadata,
  PositionMap,
  CreditPosition,
  BORROWER_POSITION_ROLE,
  LENDER_POSITION_ROLE,
  ARBITER_POSITION_ROLE,
  LineEvents,
  AggregatedEscrow,
  AggregatedSpigot,
  CollateralEvent, // prev. GeneralVaultView, Super indepth data, SecuredLineWithEvents is most similar atm
  CreditProposal,
} from '@types';
import { toBN, unnullify } from '@utils';
import { getConstants } from '@src/config/constants';

import { initialLineActionsStatusMap } from './lines.reducer';

const { ZERO_ADDRESS } = getConstants();

/* ---------------------------------- State --------------------------------- */
const selectUserWallet = (state: RootState) => state.wallet.selectedAddress;
const selectLinesState = (state: RootState) => state.lines;

// const selectUserLinesMetadataMap = (state: RootState) => state.lines.user.userLinesMetadataMap;
const selectLinesMap = (state: RootState) => state.lines.linesMap;
const selectPositionsMap = (state: RootState) => state.lines.positionsMap;
const selectCreditEventsMap = (state: RootState) => state.lines.eventsMap;
const selectLineCategories = (state: RootState) => state.lines.categories;
//const selectLinesAddresses = (state: RootState) => Object.keys(state.lines.linesMap);
const selectUserTokensMap = (state: RootState) => state.tokens.user.userTokensMap;
//const selectUserTokensAllowancesMap = (state: RootState) => state.tokens.user.userTokensAllowancesMap;
//const selectLinesAllowancesMap = (state: RootState) => state.lines.user.lineAllowances;
const selectTokensMap = (state: RootState) => state.tokens.tokensMap;
const selectSelectedLineAddress = (state: RootState) => state.lines.selectedLineAddress;
const selectSelectedPositionId = (state: RootState) => state.lines.selectedPosition;
const selectSelectedProposalId = (state: RootState) => state.lines.selectedProposal;

const selectCollateralMap = (state: RootState) => state.collateral.collateralMap;
const selectCollateralEventsMap = (state: RootState) => state.collateral.eventsMap;

// const selectExpectedTxOutcome = (state: RootState) => state.lines.transaction.expectedOutcome;
// const selectExpectedTxOutcomeStatus = (state: RootState) => state.lines.statusMap.getExpectedTransactionOutcome;
const selectUserLinesSummary = (state: RootState) => state.lines.user.linePositions;

/* ---------------------------------- Action Statuses --------------------------------- */
const selectLinesStatusMap = (state: RootState) => state.lines.statusMap;
const selectLinesActionsStatusMap = (state: RootState) => state.lines.statusMap.user.linesActionsStatusMap;

const selectGetLinesStatus = (state: RootState) => state.lines.statusMap.getLines;
const selectGetLinePageStatus = (state: RootState) => state.lines.statusMap.getLinePage;

/* ----------------------------- Main Selectors ----------------------------- */
const selectLines = createSelector([selectLinesMap], (linesMap) => {
  return Object.values(linesMap);
});

const selectLiveLines = createSelector([selectLines], (lines): SecuredLine[] => {
  return lines.filter((line: SecuredLine) => line.end < Date.now() / 1000);
});

const selectSelectedPosition = createSelector(
  [selectPositionsMap, selectSelectedPositionId],
  (positions, id = ''): CreditPosition | undefined => {
    return positions[id];
  }
);

const selectSelectedLine = createSelector(
  [selectLinesMap, selectSelectedLineAddress, selectSelectedPosition],
  (lines, selectedLineAddress, position) => {
    if (!selectedLineAddress && (!position || !position.line)) return undefined;
    return lines[selectedLineAddress ?? position!.line];
  }
);

const selectSelectedProposal = createSelector(
  [selectPositionsMap, selectSelectedPositionId, selectSelectedProposalId],
  (positions, positionId = '', proposalId = ''): CreditProposal | undefined => {
    return positions[positionId] ? positions[positionId].proposalsMap[proposalId] : undefined;
  }
);

const selectPositionsForSelectedLine = createSelector(
  [selectPositionsMap, selectSelectedLineAddress],
  (positionsMap, line): PositionMap => {
    if (!line) {
      return {};
    } else {
      // Create and return PositionMap of only positions for a given line
      const linePositions = _.values(positionsMap).filter((p) => p.line === line);
      const linePositionsObj = _.transform(
        linePositions,
        function (result, position) {
          result[position.id] = position;
        },
        {} as PositionMap
      );
      return linePositionsObj;
    }
  }
);

const selectCollateralForSelectedLine = createSelector(
  [selectSelectedLine, selectCollateralMap],
  (line, allCollateral) => {
    return {
      escrow: allCollateral[line?.escrowId ?? ''] as AggregatedEscrow,
      spigot: allCollateral[line?.spigotId ?? ''] as AggregatedSpigot,
    };
  }
);

const selectCollateralEventsForSelectedLine = createSelector(
  [selectCollateralEventsMap, selectSelectedLineAddress, selectCollateralForSelectedLine],
  (events, lineAddress, collateral) => {
    if (!lineAddress) return { collateralEvents: [] };
    return { collateralEvents: events[lineAddress] ?? [] };
  }
);

const selectCreditEventsForSelectedLine = createSelector(
  [selectCreditEventsMap, selectSelectedLineAddress],
  (events, line = '') => ({ creditEvents: events[line] ?? [] })
);

const selectEventsForLine = createSelector(
  [selectCreditEventsForSelectedLine, selectCollateralEventsForSelectedLine],
  (creditEvents, collateralEvents): LineEvents => {
    // @TODO return xhecksum address
    return { ...creditEvents, ...collateralEvents };
  }
);

const selectSelectedLinePage = createSelector(
  [selectSelectedLine, selectPositionsForSelectedLine, selectCollateralForSelectedLine, selectEventsForLine],
  (line, positions, collateral, events): SecuredLineWithEvents | undefined => {
    if (!line) return undefined;
    return { ...line, positions, ...collateral, ...events };
  }
);

const selectUserPortfolioMetadata = (state: RootState) => state.lines.user.portfolio;

const selectUserPortfolio = createSelector(
  [
    selectLinesMap,
    selectUserPortfolioMetadata,
    selectPositionsMap,
    selectCollateralMap,
    selectCreditEventsMap,
    selectCollateralEventsMap,
  ],
  (linesMap, userPortfolio, positions, collaterals, creditEvents, collatEvents) => {
    const getSecuredLineData = (line: string): SecuredLine => {
      return {
        ...linesMap[line],
        escrow: _.find(collaterals, (m) => m.type === 'asset' && m.line === line) as AggregatedEscrow,
        spigot: _.find(collaterals, (m) => m.type === 'revenue' && m.line === line) as AggregatedSpigot,
        positions: _.filter(positions, (p) => p.line === line).reduce((map, p) => ({ ...map, [p.id]: p }), {}),
        // creditEvents: creditEvents[line],
        // get collateralEvents() {
        //   return [...collatEvents[this.escrow?.id ?? ''], ...collatEvents[this.spigot?.id ?? '']]
        // }
      };
    };
    // @TODO return secured lines type here
    // can copy selSelLinePage but do better sorting on events/modules to construct
    return {
      borrowerLineOfCredits: userPortfolio.borrowerLineOfCredits.map(getSecuredLineData),
      lenderPositions: userPortfolio.lenderPositions,
      arbiterLineOfCredits: userPortfolio.arbiterLineOfCredits.map(getSecuredLineData),
    };
  }
);

const selectSelectedLineActionsStatusMap = createSelector(
  [selectLinesActionsStatusMap, selectSelectedLineAddress],
  (linesActionsStatusMap, selectedLineAddress): LineActionsStatusMap => {
    return selectedLineAddress ? linesActionsStatusMap[selectedLineAddress] : initialLineActionsStatusMap;
  }
);

const selectLinesForCategories = createSelector(
  [selectLinesMap, selectLineCategories],
  (linesMap, categories): { [key: string]: SecuredLine[] } => {
    return Object.entries(categories).reduce(
      (obj: object, [category, lines]: [string, string[]]) => ({
        ...obj,
        [category]: lines.map((l: string): SecuredLine => linesMap[l]),
      }),
      {}
    );
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

const selectLine = createSelector([selectLinesMap], (linesMap) =>
  memoize((lineAddress: string) => linesMap[lineAddress])
);

/* -------------------------------- Statuses -------------------------------- */
const selectLinesGeneralStatus = createSelector([selectLinesStatusMap], (statusMap): Status => {
  const loading = statusMap.getLines.loading;
  const error = statusMap.getLines.error;
  return { loading, error };
});

const selectUserPositionMetadata = createSelector(
  [
    selectUserWallet,
    selectSelectedLine,
    selectSelectedPosition,
    selectPositionsForSelectedLine,
    selectCollateralForSelectedLine,
  ],
  (userAddress, line, selectedPosition, positions, collateral): UserPositionMetadata => {
    const defaultRole = {
      role: LENDER_POSITION_ROLE,
      amount: '0',
      available: '0',
    };
    if (!line || !userAddress) return defaultRole;

    const position = selectedPosition || positions[0];

    switch (getAddress(userAddress!)) {
      case getAddress(line.borrower):
        const borrowerData = position
          ? { amount: position.principal, available: toBN(position.deposit).minus(toBN(position.principal)).toString() }
          : { amount: line.principal, available: toBN(line.deposit).minus(toBN(line.principal)).toString() };
        return {
          role: BORROWER_POSITION_ROLE,
          ...borrowerData,
        };

      case getAddress(line.arbiter):
        const arbiterData = {
          amount: unnullify(collateral.escrow?.collateralValue),
          available: unnullify(collateral.escrow?.collateralValue),
        };
        return {
          role: ARBITER_POSITION_ROLE,
          ...arbiterData,
        };

      case typeof position?.lender === 'string' && getAddress(position?.lender ?? ZERO_ADDRESS):
        const lenderData = {
          amount: position!.deposit,
          available: toBN(position!.deposit).minus(toBN(position!.principal)).toString(),
        };
        return {
          role: LENDER_POSITION_ROLE,
          ...lenderData,
        };

      default:
        // if no selected position, still try to find their position on the line

        const foundPosition = find(_.values(positions), (p) => p.lender === userAddress);
        if (foundPosition) {
          const lenderData = {
            amount: foundPosition.deposit,
            available: toBN(foundPosition.deposit).minus(toBN(foundPosition.principal)).toString(),
          };
          return {
            role: LENDER_POSITION_ROLE,
            ...lenderData,
          };
        }

        // user isnt a party on the line
        return defaultRole;
    }
  }
);

export const LinesSelectors = {
  selectLinesState,
  selectLinesMap,
  selectLines,
  selectLiveLines,
  selectPositionsMap,
  selectLinesForCategories,
  selectUserPositionMetadata,
  // selectDeprecatedLines,
  selectUserTokensMap,
  selectTokensMap,
  selectSelectedLineAddress,
  selectLinesActionsStatusMap,
  selectLinesStatusMap,
  selectUserLinesSummary,
  selectPositionsForSelectedLine,
  selectUserPortfolio,
  // selectUserPositions,
  selectLinesGeneralStatus,
  selectSelectedLine,
  selectSelectedLinePage,
  selectSelectedPositionId,
  selectSelectedProposalId,
  selectSelectedLineActionsStatusMap,
  selectSelectedPosition,
  selectSelectedProposal,
  // selectDepositedLines,
  selectSummaryData,
  //selectRecommendations,
  selectGetLinePageStatus,
  selectLine,
  selectCollateralForSelectedLine,
  selectCollateralEventsForSelectedLine,
  selectEventsForLine,
  // selectExpectedTxOutcome,
  // selectExpectedTxOutcomeStatus,
};
