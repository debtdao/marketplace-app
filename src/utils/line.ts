import { isEmpty, zipWith } from 'lodash';
import { BigNumber, utils } from 'ethers';
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
  EscrowDepositList,
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
  EscrowEvent,
  // SpigotEvents,
  GetLineEventsResponse,
  AggregatedEscrow,
  AggregatedSpigot,
  SpigotEventFragResponse,
} from '@types';

import { humanize, normalizeAmount, normalize } from './format';

const { parseUnits } = utils;

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

// TODO: Modify/adjust this to replace mergeCollateralEvents (formatCollateralEvents)
// given that there are 3 duplicative uses of collateral events in this file!!
export const formatEscrowToCollateralEvents = (escrow: AggregatedEscrow | undefined): CollateralEvent[] => {
  // console.log('get line events escrow: ', escrow);
  const collateralEvents: CollateralEvent[] = escrow!
    ? _.map(escrow.deposits, function (deposit) {
        // console.log('get line individual deposits: ', deposit);
        return {
          type: deposit.type,
          id: deposit.token.address,
          // TODO: timestamp should probably be removed from the type given this aggregates
          // collateral by type and token address
          timestamp: 0,
          amount: Number(deposit.amount),
          // TODO: replace with correct USD value when we have it
          value: 0,
        } as CollateralEvent;
      })
    : [];
  return collateralEvents;
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
// export const formatCollateralEvents = (
//   type: ModuleNames,
//   symbol: string,
//   price: BigNumber = BigNumber.from(0),
//   // events: EscrowDepositList,
//   // events: CollateralEvent[],
//   events: EscrowEventFragResponse[] | undefined,
//   // events: EscrowDepositList, //| SpigotEvents, //
//   tokenRevenue?: any
// ): [number, CollateralEvent[]] => {
//   let totalVal = 0;
//   if (!events) return [totalVal, []];
//   // TODO promise.all token price fetching for better performance
//   const newEvents: (CollateralEvent | undefined)[] = events?.map((event: any): CollateralEvent | undefined => {
//     console.log('get line page data - individual event: ', event);
//     const { __typename, timestamp, amount, token, value = unnullify(0, true) } = event;
//     if (!timestamp || !amount) return undefined;
//     console.log('get line page data - individual event 2: ', token);
//     const valueNow = unnullify(price.toString(), true).times(unnullify((amount.toString(), true)));
//     let collatType;
//     switch (type) {
//       case SPIGOT_MODULE_NAME:
//         // aggregate token revenue. not needed for escrow bc its already segmented by token
//         // use price at time of revenue for more accuracy
//         tokenRevenue[symbol] += parseUnits(unnullify(tokenRevenue[symbol], true), 'ether').add(value).toString();
//         collatType = COLLATERAL_TYPE_REVENUE;
//         break;
//       case ESCROW_MODULE_NAME:
//         collatType = COLLATERAL_TYPE_ASSET;
//         break;
//       default:
//         break;
//     }

//     totalVal += valueNow;

//     return {
//       type: collatType,
//       __typename,
//       timestamp,
//       amount,
//       value,
//       valueNow,
//       id: token?.id,
//     };
//   });
//   const validEvents = newEvents.filter((x) => !!x) as CollateralEvent[];
//   console.log('line page data - valid events: ', validEvents);
//   return [totalVal, validEvents];
// };

export const formatCollateralEvents = (
  type: ModuleNames,
  token: TokenFragRepsonse,
  price: BigNumber = BigNumber.from(0),
  // events: EscrowDepositList,
  // events: CollateralEvent[],
  events: EscrowEventFragResponse[] | undefined,
  // events: EscrowDepositList, //| SpigotEvents, //
  tokenRevenue?: any
): [number, CollateralEvent[]] => {
  let totalVal = 0;
  if (!events) return [totalVal, []];
  // TODO promise.all token price fetching for better performance
  const newEvents: (CollateralEvent | undefined)[] = events?.map((event: any): CollateralEvent | undefined => {
    // console.log('get line page data - individual event: ', event);
    const { __typename, timestamp, amount, value = unnullify(0, true) } = event;
    if (!timestamp || !amount) return undefined;
    // console.log(
    //   'get line page data - individual event 2: ',
    //   unnullify(price.toString(), true),
    //   unnullify((amount.toString(), true))
    // );
    // const valueNow = unnullify(price.toString(), true).times(unnullify((amount.toString(), true)));
    const valueNow = 0;
    console.log('get line page data - individual event 3: ', valueNow);
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
      value,
      valueNow,
      id: token?.id,
    };
  });
  const validEvents = newEvents.filter((x) => !!x) as CollateralEvent[];
  // console.log('line page data - valid events: ', validEvents);
  return [totalVal, validEvents];
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
      positions,
      events,
      escrowRes?.deposits ?? [],
      spigotRes?.revenues ?? [],
      tokenPrices
    );
    // const deposits = escrowRes?.deposits.map((d: any) => ({ ...d, token: d.token.id }));
    // formatAggData (positions, deposits, summaries);

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
  positionFrags: (BasePositionFragResponse | BasePositionFragResponse)[],
  eventFrags: LineEventFragResponse[],
  escrow: any,
  // collateralDeposits: BaseEscrowDepositFragResponse[],
  spigot: any,
  // revenues: SpigotRevenueSummaryFragResponse[],
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
  creditEvents: CreditEvent[];
  collateralEvents: CollateralEvent[];
  // spigot: { type: CollateralTypes; line: string; tokenRevenue: { [key: string]: string } };
  spigot: AggregatedSpigot; //& CollateralEvent[];
  escrow: AggregatedEscrow; //& CollateralEvent[];
  // escrow: {
  //   type: CollateralTypes;
  //   line: string;
  //   collateralValue: string;
  //   cratio: string;
  //   deposits: EscrowDepositList;
  //   // TODO add formated deposits here
  // };
} => {
  // derivative or aggregated data we need to compute and store while mapping position data
  const collateralDeposits: BaseEscrowDepositFragResponse[] = escrow?.deposits || [];
  const revenues: SpigotRevenueSummaryFragResponse[] = spigot?.summaries || [];

  // position id, token address, APY
  const highestApy: [string, string, string] = ['', '', '0'];
  const principal = BigNumber.from(0);
  const deposit = BigNumber.from(0);

  const credit = positionFrags.reduce(
    (agg: any, c) => {
      const price = tokenPrices[c.token?.id] || BigNumber.from(0);
      // const highestApy = BigNumber.from(c.dRate).gt(BigNumber.from(agg.highestApy[2]))
      //   ? [c.id, c.token?.id, c.dRate]
      //   : agg.highestApy;
      return {
        // lender: agg.lender.id,
        principal: agg.principal.add(price.mul(unnullify(c.principal).toString())),
        deposit: agg.deposit.add(price.mul(unnullify(c.deposit).toString())),
        highestApy,
      };
    },
    { principal, deposit, highestApy }
  );

  const [collateralValue, deposits]: [BigNumber, EscrowDepositList] = collateralDeposits.reduce(
    (agg, collateralDeposit) => {
      const price = unnullify(tokenPrices[collateralDeposit.token.id], true);
      return !collateralDeposit.enabled
        ? agg
        : [
            agg[0].add(parseUnits(unnullify(collateralDeposit.amount).toString(), 'ether').mul(price)),
            {
              ...agg[1],
              [collateralDeposit.token.id]: {
                ...collateralDeposit,
                type: COLLATERAL_TYPE_ASSET,
                token: _createTokenView(collateralDeposit.token, BigNumber.from(collateralDeposit.amount), price),
              },
            },
          ];
    },
    [BigNumber.from(0), {}]
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
        // console.log('individual deposit collateral events: ', depositCollateralEvents);
        return depositCollateralEvents;
      })
    )
  );
  // console.log('escrow collateral events', escrowCollateralEvents);

  // TODO: get spigot collateral events

  const creditEvents = formatCreditEvents('', BigNumber.from(0), eventFrags);

  const aggregatedEscrow = {
    id: escrow.id,
    type: COLLATERAL_TYPE_ASSET,
    line,
    deposits,
    collateralValue: collateralValue.toString(),
    cratio: parseUnits(unnullify(credit.principal).toString(), 'ether').eq(0)
      ? '0'
      : collateralValue.div(unnullify(credit.principal).toString()).toString(),
    // TODO: fill in with appropriate value, not copied directly from cratio
    minCRatio: parseUnits(unnullify(credit.principal).toString(), 'ether').eq(0)
      ? '0'
      : collateralValue.div(unnullify(credit.principal).toString()).toString(),
  };

  // aggregated revenue in USD by token across all spigots
  const tokenRevenue: { [key: string]: string } = revenues.reduce((ggg, revenue) => {
    return { ...revenue, [revenue.token]: (revenue.totalVolumeUsd ?? '0').toString() };
  }, {});

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
      principal: parseUnits(unnullify(credit.principal), 'ether').toString(),
      deposit: parseUnits(unnullify(credit.deposit), 'ether').toString(),
      interest: '0', // TODO
      totalInterestRepaid: '0', // TODO
      positionIds: Object.keys(positions),
      positions,
    },
    collateralEvents: escrowCollateralEvents,
    creditEvents,
    escrow: aggregatedEscrow,
    spigot: { id: spigot.id, type: COLLATERAL_TYPE_REVENUE, line, tokenRevenue },
  };
};

export const formatLineWithEvents = (
  selectedLine: SecuredLineWithEvents,
  lineEvents: GetLineEventsResponse | undefined
): SecuredLineWithEvents | undefined => {
  if (!lineEvents) return undefined;
  const { creditEvents: oldCreditEvents, collateralEvents: oldCollateralEvents, escrow, ...rest } = selectedLine;
  const { events: creditEvents, spigot } = lineEvents;

  // Create collateralEvents
  console.log('Get Line Events Escrow: ', escrow);
  console.log('Get Line Events Spigot: ', spigot);
  const collateralEvents = formatEscrowToCollateralEvents(escrow);
  console.log('get line page data 1: ', collateralEvents);

  // Add collateralEvents and creditEvents to SecuredLine
  const selectedLineWithEvents = { creditEvents, collateralEvents, escrow, ...rest } as SecuredLineWithEvents;
  return selectedLineWithEvents;
};

export const formatLinePageData = (
  lineData: GetLinePageResponse | undefined,
  tokenPrices: { [token: string]: BigNumber }
): SecuredLineWithEvents | undefined => {
  if (!lineData) return undefined;
  // add token Prices as arg
  // console.log('User Portfolio actions selectedLine 2: ', lineData);
  const {
    spigot,
    escrow,
    positions,
    borrower,
    status,
    events,
    ...metadata
    // userLinesMetadataMap,
  } = lineData;
  const {
    credit,
    creditEvents,
    collateralEvents,
    spigot: spigotData,
    escrow: escrowData,
  } = formatSecuredLineData(metadata.id, positions!, events!, escrow, spigot, tokenPrices);

  console.log('Get LinePage - collateral events: ', collateralEvents);
  // derivative or aggregated data we need to compute and store while mapping position data
  // position id and APY
  console.log('Get Line Page - LineEventFrag test: ', lineData.events);
  console.log('Get Line Page - EscrowEventFrag test: ', lineData.escrow);
  // Create array of CollateralEvent[]
  // const collateralEvents = formatEscrowToCollateralEvents(escrowData);
  console.log('Get Line Page escrow: ', escrow);
  console.log('Get Line Page escrow data for collateral: ', escrowData);
  const collateralEvents2: CollateralEvent[] = _.map(escrowData.deposits, function (deposit) {
    // console.log('get line page individual deposits: ', deposit);
    return {
      type: deposit.type,
      id: deposit.token.address,
      // TODO: timestamp should probably be removed from the type given this aggregates
      // collateral by type and token address
      timestamp: 0,
      amount: Number(deposit.amount),
      // TODO: replace with correct USD value when we have it
      value: 0,
    } as CollateralEvent;
  });
  // console.log('Get Line Page Data - Collateral Events 1: ', collateralEvents);
  // console.log('Get Line Page Data - Collateral Events 2: ', collateralEvents2);

  //Derive Collateral Events by
  // aggregated revenue in USD by token across all spigots
  //  all recent Spigot and Escrow events

  // let collateralEvents: CollateralEvent[] = escrow?
  //  all recent borrow/lend events
  // const creditEvents: CreditEvent[] = [];

  // TODO add spigot events to collateralEvents
  const formattedSpigot = {
    ...spigot!,
    ...spigotData,
  };

  const pageData: SecuredLineWithEvents = {
    // metadata
    ...metadata,
    // debt data
    ...credit,
    creditEvents,
    collateralEvents: collateralEvents,
    borrower: borrower.id,
    status: status.toLowerCase() as LineStatusTypes,
    // TODO add UsePositionMetada,

    // all recent events
    // TODO add creditEvents
    // collateralEvents,
    // collateral data
    spigotId: spigot?.id ?? '',
    escrowId: escrow?.id ?? '',
    spigot: formattedSpigot,
    // escrow: { ...escrow!, ...escrowData },
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
      } = formatSecuredLineData(rest.id, positions, events, escrow, spigot, tokenPrices);

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
