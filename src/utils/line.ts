import { isEmpty, zipWith } from 'lodash';
import { BigNumber, ethers, utils } from 'ethers';
import { getAddress } from '@ethersproject/address';
import _ from 'lodash';

import {
  SecuredLineWithEvents,
  SecuredLine,
  CreditEvent,
  CollateralEvent,
  ModuleNames,
  ESCROW_MODULE_NAME,
  SPIGOT_MODULE_NAME,
  LineStatusTypes,
  GetLinePageResponse,
  LineOfCreditsResponse,
  CollateralTypes,
  GetLinesResponse,
  BaseEscrowDepositFragResponse,
  SpigotRevenueSummaryFragResponse,
  BasePositionFragResponse,
  LineEventFragResponse,
  EscrowEventFragResponse,
  // EscrowDepositList,
  EscrowDepositMap,
  TokenFragRepsonse,
  COLLATERAL_TYPE_REVENUE,
  COLLATERAL_TYPE_ASSET,
  CreditPosition,
  Address,
  GetUserPortfolioResponse,
  PositionMap,
  LENDER_POSITION_ROLE,
  BaseLineFragResponse,
  EscrowDeposit,
  GetLineEventsResponse,
  AggregatedEscrow,
  RevenueSummary,
  RevenueSummaryMap,
  AggregatedSpigot,
  SpigotEventFragResponse,
  SpigotRevenueContractFragResponse,
  SpigotRevenueContract,
  SpigotRevenueContractMap,
} from '@types';

import { humanize, normalizeAmount, normalize } from './format';

const { parseUnits, formatUnits } = utils;

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
export const formatCreditEvents = (
  symbol: string,
  price: BigNumber = BigNumber.from(0),
  events: LineEventFragResponse[]
): CreditEvent[] => {
  return events.map((event: any): CreditEvent => {
    const { id, timestamp, __typename, amount, value, position } = event;
    return {
      id,
      __typename,
      timestamp,
      amount,
      // value: unnullify(value, true),
      value,
      token: position.token.id,
      // currentValue: price.mul(value),
    };
  });
};

/**
 * @function
 * @name mergeCollateralEvents
 * @desc - takes all events for a single escrow deposit/spigot and merges them into global list
 * @dev  - expects all events to be in the same token
 * @param type - the type of module used as collateral
 * @param symbol - the token in event
 * @param price - current price for escrow deposit/spigot collateral
 * @param events - the events to process
 * @return totalVal, CollateralEvent[] - current total value of all collateral
 */

// TODO: refactor this function as it currently only works for Escrow events, not Spigot events or Line/Credit Events
export const formatCollateralEvents = (
  type: ModuleNames,
  token: TokenFragRepsonse,
  price: BigNumber = BigNumber.from(0),
  events: EscrowEventFragResponse[] | undefined,
  tokenRevenue?: any
): [number, CollateralEvent[]] => {
  let totalVal = 0;
  if (!events) return [totalVal, []];
  // TODO promise.all token price fetching for better performance
  const newEvents: (CollateralEvent | undefined)[] = events?.map(
    (event: EscrowEventFragResponse): CollateralEvent | undefined => {
      const { __typename, timestamp, amount, value = unnullify(0, true) } = event;
      if (!timestamp || !amount) return undefined;
      // const valueNow = unnullify(price.toString(), true).times(unnullify((amount.toString(), true)));
      const valueNow = 0;
      let collatType;
      switch (type) {
        case SPIGOT_MODULE_NAME:
          // aggregate token revenue. not needed for escrow bc its already segmented by token
          // use price at time of revenue for more accuracy
          tokenRevenue[token.symbol] += parseUnits(unnullify(tokenRevenue[token.symbol], true), 'ether')
            .add(value)
            .toString();
          collatType = COLLATERAL_TYPE_REVENUE;
          break;
        case ESCROW_MODULE_NAME:
          collatType = COLLATERAL_TYPE_ASSET;
          break;
        default:
          break;
      }

      totalVal += valueNow;

      return {
        type: collatType,
        __typename,
        timestamp,
        amount,
        value: String(value),
        valueNow: String(valueNow),
        id: token?.id,
      };
    }
  );
  const validEvents = newEvents.filter((x) => !!x) as CollateralEvent[];
  return [totalVal, validEvents];
};

// TODO: Refactor this function by merging it with formatCollateralEvents.
export const formatSpigotCollateralEvents = (events: SpigotEventFragResponse[] | undefined): CollateralEvent[] => {
  if (!events) return [];
  const spigotEvents = events
    .filter((event: SpigotEventFragResponse) => event.__typename === 'ClaimRevenueEvent')
    .map((event: SpigotEventFragResponse) => {
      const { revenueToken, amount, timestamp, value } = event;
      return {
        id: revenueToken.id as Address,
        type: 'revenue' as CollateralTypes,
        timestamp,
        amount,
        value,
      };
    });
  return spigotEvents;
};

/** Formatting functions. from GQL structured response to flat data for redux state  */

export const unnullify = (thing: any, toBN?: boolean) => {
  const x = !thing ? '0' : thing.toString();
  return toBN ? BigNumber.from(x) : x;
};

export function formatGetLinesData(
  response: GetLinesResponse[],
  tokenPrices: { [token: string]: BigNumber }
): SecuredLine[] {
  return response.map((data: any) => {
    const {
      borrower: { id: borrower },
      positions,
      events = [],
      escrow: escrowRes,
      spigot: spigotRes,
      status,
      ...rest
    } = data;
    const { credit, spigot, escrow } = formatSecuredLineData(
      rest.id,
      spigotRes?.id ?? '',
      escrowRes?.id ?? '',
      positions,
      events,
      escrowRes,
      spigotRes,
      tokenPrices
    );

    return {
      ...rest,
      ...credit,
      status: status.toLowerCase() as LineStatusTypes,
      borrower,
      spigotId: spigotRes?.id,
      escrowId: escrowRes?.id,
      spigot: {
        ...(spigotRes ?? {}),
        ...spigot,
      },
      escrow: {
        ...(escrowRes ?? {}),
        ...escrow,
      },
    };
  });
}

export const formatSecuredLineData = (
  line: Address, // BaseLineFrag
  spigotId: Address,
  escrowId: Address,
  positionFrags: (BasePositionFragResponse | BasePositionFragResponse)[],
  eventFrags: LineEventFragResponse[],
  escrow: any,
  spigot: any,
  tokenPrices: { [token: string]: BigNumber }
): {
  credit: {
    highestApy: [string, string, string];
    principal: string;
    deposit: string;
    interest: string;
    totalInterestRepaid: string;
    positionIds: string[];
    positions: PositionMap;
  };
  collateralEvents: CollateralEvent[];
  creditEvents: CreditEvent[];
  spigot: AggregatedSpigot;
  escrow: AggregatedEscrow;
} => {
  console.log('do I get here 17');
  // derivative or aggregated data we need to compute and store while mapping position data
  const collateralDeposits: BaseEscrowDepositFragResponse[] = escrow?.deposits || [];
  const revenues: SpigotRevenueSummaryFragResponse[] = spigot?.summaries || [];
  const spigots: SpigotRevenueContractFragResponse[] = spigot.spigots || [];

  // position id, token address, APY
  const highestApy: [string, string, string] = ['', '', '0'];
  const principal = BigNumber.from(0);
  const deposit = BigNumber.from(0);
  const totalInterestRepaid = BigNumber.from(0);

  // TODO: Convert all position values (principal, deposit, totalInterestRepaid) to 18 decimals before aggregating.
  const credit: {
    principal: BigNumber;
    deposit: BigNumber;
    highestApy: [string, string, string];
    totalInterestRepaid: BigNumber;
  } = positionFrags.reduce(
    (agg: any, c) => {
      const checkSumAddress = ethers.utils.getAddress(c.token?.id);
      const usdcPrice = tokenPrices[checkSumAddress] ?? BigNumber.from(0);
      const tokenDecimals = c.token.decimals;
      return {
        principal: agg.principal.add(usdcPrice.mul(unnullify(c.principal).toString())),
        deposit: agg.deposit.add(usdcPrice.mul(unnullify(c.deposit)).toString()),
        highestApy,
        totalInterestRepaid: agg.totalInterestRepaid.add(usdcPrice.mul(unnullify(c.interestRepaid)).toString()),
      };
    },
    { principal, deposit, highestApy, totalInterestRepaid }
  );

  // Sum value of deposits and create deposits map
  const [collateralValue, deposits]: [BigNumber, EscrowDepositMap] = collateralDeposits.reduce(
    (agg, collateralDeposit) => {
      const checkSumAddress = ethers.utils.getAddress(collateralDeposit.token.id);
      const usdcPrice = tokenPrices[checkSumAddress] ?? BigNumber.from(0);
      return !collateralDeposit.enabled
        ? agg
        : [
            agg[0].add(unnullify(collateralDeposit.amount, true).mul(usdcPrice)),
            {
              ...agg[1],
              [collateralDeposit.token.id]: {
                ...collateralDeposit,
                type: COLLATERAL_TYPE_ASSET,
                token: _createTokenView(collateralDeposit.token, BigNumber.from(collateralDeposit.amount), usdcPrice),
                value: formatUnits(unnullify(collateralDeposit.amount, true).mul(usdcPrice).toString(), 6).toString(),
              },
            },
          ];
    },
    [BigNumber.from(0), {}]
  );

  // Create spigots map
  const spigotRevenueContracts: SpigotRevenueContractMap = spigots.reduce(
    (revenueContractMap: SpigotRevenueContractMap, revenueContract: SpigotRevenueContractFragResponse) => {
      const { contract, ...rest } = revenueContract;
      return {
        ...revenueContractMap,
        [contract]: {
          contract,
          ...rest,
        } as SpigotRevenueContract,
      };
    },
    {} as SpigotRevenueContractMap
  );

  // Get escrow collateral events
  const escrowCollateralEvents: CollateralEvent[] = _.flatten(
    _.merge(
      collateralDeposits.map((deposit) => {
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

  const creditEvents = formatCreditEvents('', BigNumber.from(0), eventFrags);

  const aggregatedEscrow: AggregatedEscrow = {
    id: escrowId,
    type: COLLATERAL_TYPE_ASSET,
    line,
    collateralValue: formatUnits(unnullify(collateralValue), 6).toString(),
    cratio: parseUnits(credit.principal.toString(), 'ether').eq(0)
      ? '0'
      : String(Number(BigNumber.from(10000).mul(collateralValue).div(credit.principal).toString()) / 100),
    minCRatio: escrow.minCRatio,
    events: escrowCollateralEvents,
    deposits,
  };

  // aggregated revenue in USD by token across all spigots
  const [revenueValue, revenueSummary]: [BigNumber, RevenueSummaryMap] = revenues.reduce<any>(
    (agg, { token, totalVolume, totalVolumeUsd, ...summary }) => {
      const checkSumAddress = ethers.utils.getAddress(token.id);
      const usdcPrice = tokenPrices[checkSumAddress] ?? BigNumber.from(0);
      return [
        agg[0].add(unnullify(totalVolume).toString()).mul(usdcPrice),
        {
          ...agg[1],
          [getAddress(token.id)]: {
            ...summary,
            type: COLLATERAL_TYPE_REVENUE,
            token: _createTokenView(
              token,
              BigNumber.from(totalVolume),
              BigNumber.from(totalVolumeUsd).div(BigNumber.from(totalVolume))
            ), // use avg price at time of revenue
            amount: totalVolume,
            value: (totalVolumeUsd ?? '0').toString(),
          },
        },
      ];
    },
    [BigNumber.from(0), {} as RevenueSummaryMap]
  );

  const spigotEvents = formatSpigotCollateralEvents(spigot.events);
  const collateralEvents = _.concat(spigotEvents, escrowCollateralEvents);

  const aggregatedSpigot: AggregatedSpigot = {
    id: spigotId,
    type: COLLATERAL_TYPE_REVENUE,
    line,
    revenueValue: formatUnits(unnullify(revenueValue), 6).toString(),
    revenueSummary,
    events: spigotEvents,
    spigots: spigotRevenueContracts,
  };

  const positions = positionFrags.reduce((obj: any, c: BasePositionFragResponse): PositionMap => {
    const { dRate, fRate, id, lender, line: lineObj, token, ...financials } = c;
    const lenderAddress = lender.id;

    const currentUsdPrice = tokenPrices[c.token?.id];
    return {
      ...obj,
      [id]: {
        id,
        lender: lenderAddress,
        line,
        ...financials,
        // dRate: normalizeAmount(fRate, 2),
        // fRate: normalizeAmount(dRate, 2),
        dRate,
        fRate,
        token: _createTokenView(token, BigNumber.from(principal), currentUsdPrice),
        // events,
      },
    };
  }, {});

  return {
    credit: {
      highestApy,
      principal: formatUnits(unnullify(credit.principal), 6).toString(),
      deposit: formatUnits(unnullify(credit.deposit), 6).toString(),
      interest: '0', // TODO
      totalInterestRepaid: formatUnits(unnullify(credit.totalInterestRepaid), 6).toString(),
      positionIds: Object.keys(positions),
      positions,
    },
    collateralEvents,
    creditEvents,
    escrow: aggregatedEscrow,
    spigot: aggregatedSpigot,
  };
};

export const formatLineWithEvents = (
  selectedLine: SecuredLineWithEvents,
  lineEvents: GetLineEventsResponse | undefined,
  tokenPrices: { [token: string]: BigNumber }
): SecuredLineWithEvents | undefined => {
  if (!lineEvents) return undefined;
  const {
    creditEvents: oldCreditEvents,
    collateralEvents: oldCollateralEvents,
    escrow,
    spigot,
    ...rest
  } = selectedLine;
  const { events: creditEvents } = lineEvents;

  // Create deposit map for aggregated escrow object
  const [collateralValue, deposits]: [BigNumber, EscrowDepositMap] = lineEvents.escrow.deposits.reduce(
    (agg, collateralDeposit) => {
      const checkSumAddress = ethers.utils.getAddress(collateralDeposit.token.id);
      const usdcPrice = tokenPrices[checkSumAddress] ?? BigNumber.from(0);
      return !collateralDeposit.enabled
        ? agg
        : [
            agg[0].add(unnullify(collateralDeposit.amount, true).mul(usdcPrice)),
            {
              ...agg[1],
              [collateralDeposit.token.id]: {
                ...collateralDeposit,
                type: COLLATERAL_TYPE_ASSET,
                token: _createTokenView(collateralDeposit.token, BigNumber.from(collateralDeposit.amount), usdcPrice),
                value: formatUnits(unnullify(collateralDeposit.amount, true).mul(usdcPrice).toString(), 6).toString(),
              },
            },
          ];
    },
    [BigNumber.from(0), {}]
  );

  // Create spigots map for aggregated spigot object
  const spigotRevenueContracts: SpigotRevenueContractMap = lineEvents.spigot.spigots.reduce(
    (revenueContractMap: SpigotRevenueContractMap, revenueContract: SpigotRevenueContractFragResponse) => {
      const { contract, ...rest } = revenueContract;
      return {
        ...revenueContractMap,
        [contract]: {
          contract,
          ...rest,
        } as SpigotRevenueContract,
      };
    },
    {} as SpigotRevenueContractMap
  );

  // aggregated revenue in USD by token across all spigots
  const revenues: SpigotRevenueSummaryFragResponse[] = lineEvents.spigot.summaries || [];
  const [revenueValue, revenueSummary]: [BigNumber, RevenueSummaryMap] = revenues.reduce<any>(
    (agg, { token, totalVolume, totalVolumeUsd, ...summary }) => {
      console.log('rev', agg, { ...summary, totalVolume, totalVolumeUsd });
      const checkSumAddress = ethers.utils.getAddress(token.id);
      const usdcPrice = tokenPrices[checkSumAddress] ?? BigNumber.from(0);
      return [
        agg[0].add(unnullify(totalVolume).toString()).mul(usdcPrice),
        {
          ...agg[1],
          [getAddress(token.id)]: {
            ...summary,
            type: COLLATERAL_TYPE_REVENUE,
            token: _createTokenView(
              token,
              BigNumber.from(totalVolume),
              BigNumber.from(totalVolumeUsd).div(BigNumber.from(totalVolume))
            ), // use avg price at time of revenue
            amount: totalVolume,
            value: (totalVolumeUsd ?? '0').toString(),
          },
        },
      ];
    },
    [BigNumber.from(0), {} as RevenueSummaryMap]
  );

  // Get escrow collateral events
  const escrowCollateralEvents: CollateralEvent[] = _.flatten(
    _.merge(
      lineEvents.escrow.deposits.map((deposit) => {
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

  // Get spigot collateral events
  const spigotEvents = formatSpigotCollateralEvents(lineEvents.spigot.events);
  const collateralEvents = _.concat(spigotEvents, escrowCollateralEvents);

  // Add events and deposits to escrow object
  const aggregatedEscrow: AggregatedEscrow = {
    id: escrow!.id,
    type: COLLATERAL_TYPE_ASSET,
    line: escrow!.line,
    collateralValue: formatUnits(unnullify(collateralValue), 6).toString(),
    cratio: escrow!.cratio,
    minCRatio: escrow!.minCRatio,
    events: escrowCollateralEvents,
    deposits,
  };

  // Add events to spigot object
  const aggregatedSpigot: AggregatedSpigot = {
    id: spigot!.id,
    type: COLLATERAL_TYPE_REVENUE,
    line: spigot!.line,
    revenueValue: formatUnits(revenueValue, 6).toString(),
    revenueSummary: revenueSummary,
    events: spigotEvents,
    spigots: spigotRevenueContracts,
  };

  // Add collateralEvents and creditEvents to SecuredLine
  const selectedLineWithEvents = {
    collateralEvents,
    creditEvents,
    escrow: aggregatedEscrow,
    spigot: aggregatedSpigot,
    ...rest,
  } as SecuredLineWithEvents;
  return selectedLineWithEvents;
};

export const formatLinePageData = (
  lineData: GetLinePageResponse | undefined,
  tokenPrices: { [token: string]: BigNumber }
): SecuredLineWithEvents | undefined => {
  console.log('do I get here 16', lineData);
  if (!lineData) return undefined;
  // add token Prices as arg
  const {
    spigot,
    escrow,
    positions,
    borrower,
    status,
    events,
    defaultSplit,
    ...metadata
    // userLinesMetadataMap,
  } = lineData;
  const {
    credit,
    collateralEvents,
    creditEvents,
    spigot: spigotData,
    escrow: escrowData,
  } = formatSecuredLineData(
    metadata.id,
    spigot?.id ?? '',
    escrow?.id ?? '',
    positions!,
    events!,
    escrow,
    spigot,
    tokenPrices
  );
  console.log('do I get here 16', lineData);
  const pageData: SecuredLineWithEvents = {
    // metadata
    ...metadata,
    // debt data
    ...credit,
    collateralEvents,
    creditEvents,
    borrower: borrower.id,
    defaultSplit,
    status: status.toLowerCase() as LineStatusTypes,
    // TODO add UsePositionMetada,
    spigotId: spigot?.id ?? '',
    escrowId: escrow?.id ?? '',
    // spigot: formattedSpigot,
    spigot: spigotData,
    escrow: escrowData,
  };
  return pageData;
};

export const formatUserPortfolioData = (
  portfolioData: GetUserPortfolioResponse,
  tokenPrices: { [token: string]: BigNumber }
): { lines: { [address: string]: SecuredLineWithEvents }; positions: PositionMap } => {
  // add token Prices as arg
  // const { spigot, escrow, positions, borrower, status, ...metadata } = lineData;
  const { borrowerLineOfCredits, lenderPositions, arbiterLineOfCredits } = portfolioData;
  const lines = [...borrowerLineOfCredits, ...arbiterLineOfCredits]
    .map(({ borrower, status, positions = [], events = [], escrow, spigot, ...rest }) => {
      const {
        credit,
        spigot: spigotData,
        escrow: escrowData,
      } = formatSecuredLineData(
        rest.id,
        spigot?.id ?? '',
        escrow?.id ?? '',
        positions,
        events,
        escrow,
        spigot,
        tokenPrices
      );

      return {
        ...rest,
        ...credit,
        borrower: borrower.id,
        status: status.toLowerCase() as LineStatusTypes,

        spigotId: spigot?.id ?? '',
        escrowId: escrow?.id ?? '',
        spigot: {
          ...(spigotData ?? {}),
          ...spigot,
        },
        escrow: {
          ...(escrowData ?? {}),
          ...escrow,
        },
      };
    })
    .reduce((lines, line) => ({ ...lines, [line.id]: line }), {});

  // positions tokenFragResponse -> TokenView
  const positions: PositionMap =
    lenderPositions?.positions?.reduce(
      (map, p) => ({
        ...map,
        [p.id]: {
          ...p,
          lender: p.lender.id,
          line: p.line.id,
          token: _createTokenView(p.token, unnullify(p.principal, true), tokenPrices[p.token.id]),
        },
      }),
      {}
    ) ?? {};

  return { lines, positions };
};

const _createTokenView = (tokenResponse: TokenFragRepsonse, amount?: BigNumber, price?: BigNumber) => {
  // might already have for token in state but we only pass in prices to these util functions
  // will need to merge and prefer state vs this jank
  return {
    address: tokenResponse.id,
    name: tokenResponse.name,
    symbol: tokenResponse.symbol,
    decimals: tokenResponse.decimals,
    balance: humanize('amount', amount?.toString(), tokenResponse.decimals, 2),
    priceUsdc: humanize('amount', price?.toString(), 2, 2), // slice of last decimals -2 for rounding
    balanceUsdc:
      !amount || !price || price.eq(0)
        ? '0'
        : humanize('amount', amount?.mul(price)?.toString(), tokenResponse.decimals, 2),
    categories: [],
    description: '',
  };
};
