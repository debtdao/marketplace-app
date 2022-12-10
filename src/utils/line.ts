import { isEmpty, zipWith } from 'lodash';
import { BigNumber, utils } from 'ethers';

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
  EscrowDepositList,
  TokenFragRepsonse,
  COLLATERAL_TYPE_REVENUE,
  COLLATERAL_TYPE_ASSET,
  CreditPosition,
  Address,
  GetUserPortfolioResponse,
  PositionMap,
  LENDER_POSITION_ROLE,
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
  return events.map((e: any): CreditEvent => {
    const { __typename, amount, token, credit, timestamp, value = unnullify(0, true) } = e;
    return {
      id: credit?.id,
      __typename,
      timestamp,
      amount,
      value,
      token: token?.id,
      currentValue: price.mul(value),
    };
  });
};

/**
 * @function
 * @name mergeCollateralEvents
 * @desc - takes all events for a single deposit/spigot and merges them into global list
 * @dev  - expects all events to be in the same token
 * @param type - the type of module used as collateral
 * @param symbol - the token in event
 * @param price - current price for escrow and spigot collateral
 * @param events - the events to process
 * @return totalVal, CollateralEvent[] - current total value of all collateral
 */
export const formatCollateralEvents = (
  type: ModuleNames,
  symbol: string,
  price: BigNumber = BigNumber.from(0),
  events: CollateralEvent[],
  tokenRevenue?: any
): [number, CollateralEvent[]] => {
  let totalVal = 0;

  if (!events) return [totalVal, []];

  // TODO promise.all token price fetching for better performance
  const newEvents: (CollateralEvent | undefined)[] = events?.map((e: any): CollateralEvent | undefined => {
    const { __typename, timestamp, amount, token, value = unnullify(0, true) } = e;
    if (!timestamp || !amount) return undefined;

    const valueNow = unnullify(price.toString(), true).times(unnullify((amount.toString(), true)));
    console.log('formatCollateralevent ', __typename, amount, token, value, valueNow);
    let collatType;
    switch (type) {
      case SPIGOT_MODULE_NAME:
        // aggregate token revenue. not needed for escrow bc its already segmented by token
        // use price at time of revenue for more accuracy
        tokenRevenue[symbol] += parseUnits(unnullify(tokenRevenue[symbol], true), 'ether').add(value).toString();
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
      escrow: escrowRes,
      spigot: spigotRes,
      status,
      ...rest
    } = data;
    const { credit, spigot, escrow } = formatSecuredLineData(
      rest.id,
      positions,
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
      positions,
      borrower,
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
  line: Address,
  positionFrags: (BasePositionFragResponse | BasePositionFragResponse)[],
  collateralDeposits: BaseEscrowDepositFragResponse[],
  revenues: SpigotRevenueSummaryFragResponse[],
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
  spigot: { type: CollateralTypes; line: string; tokenRevenue: { [key: string]: string } };
  escrow: {
    type: CollateralTypes;
    line: string;
    collateralValue: string;
    cratio: string;
    deposits: EscrowDepositList;
    // TODO add formated deposits here
  };
} => {
  // derivative or aggregated data we need to compute and store while mapping position data

  // position id, token address, APY
  const highestApy: [string, string, string] = ['', '', '0'];
  const creditEvents: CreditEvent[] = [];
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

  const escrow = {
    type: COLLATERAL_TYPE_ASSET,
    line,
    deposits,
    collateralValue: collateralValue.toString(),
    cratio: parseUnits(unnullify(credit.principal).toString(), 'ether').eq(0)
      ? '0'
      : collateralValue.div(unnullify(credit.principal).toString()).toString(),
  };

  // aggregated revenue in USD by token across all spigots
  const tokenRevenue: { [key: string]: string } = revenues.reduce((ggg, revenue) => {
    return { ...revenue, [revenue.token]: (revenue.totalVolumeUsd ?? '0').toString() };
  }, {});

  const positions = positionFrags.reduce((obj: any, c: BasePositionFragResponse): PositionMap => {
    const { dRate, fRate, id, lender, token, ...financials } = c;
    const lenderAddress = lender.id;

    const currentUsdPrice = tokenPrices[c.token?.id];
    return {
      ...obj,
      [id]: {
        id,
        line,
        lender: lenderAddress,
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

  // console.log('User Portfolio credit positions func: ', positions);

  console.log('formatted page positions', positionFrags, positions);
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
    escrow,
    spigot: { type: COLLATERAL_TYPE_REVENUE, line, tokenRevenue },
  };
};

export const formatLinePageData = (
  lineData: GetLinePageResponse | undefined,
  tokenPrices: { [token: string]: BigNumber }
): SecuredLineWithEvents | undefined => {
  if (!lineData) return undefined;
  // add token Prices as arg
  const {
    spigot,
    escrow,
    positions,
    borrower,
    status,
    ...metadata
    // userLinesMetadataMap,
  } = lineData;
  console.log('User Portfolio Line F', lineData);
  const {
    credit,
    spigot: spigotData,
    escrow: escrowData,
  } = formatSecuredLineData(metadata.id, positions!, escrow?.deposits || [], spigot?.summaries || [], tokenPrices);

  // derivative or aggregated data we need to compute and store while mapping position data
  // position id and APY

  //Derive Collateral Events by
  console.log('User Portfolio actions ', 'escrow', escrow);
  // aggregated revenue in USD by token across all spigots
  //  all recent Spigot and Escrow events
  let collateralEvents: CollateralEvent[] = [];
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
    creditEvents: [], // @ TODO add to formatSecuredLineData
    borrower: borrower.id,
    status: status.toLowerCase() as LineStatusTypes,
    // TODO add UsePositionMetada,

    // all recent events
    // TODO add creditEvents
    collateralEvents,
    // collateral data
    spigot: formattedSpigot,
    escrow: isEmpty(escrow?.deposits) ? undefined : { ...escrow!, ...escrowData },
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
    .map(({ borrower, status, positions = [], escrow, spigot, ...rest }) => {
      const {
        credit,
        spigot: spigotData,
        escrow: escrowData,
      } = formatSecuredLineData(rest.id, positions, escrow?.deposits || [], spigot?.summaries || [], tokenPrices);

      return {
        ...rest,
        ...credit,
        borrower: borrower.id,
        status: status.toLowerCase() as LineStatusTypes,
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
    lenderPositions.positions?.reduce(
      (map, position) => ({
        ...map,
        [position.id]: {
          ...position,
          lender: position.lender.id,
          token: _createTokenView(position.token, unnullify(position.principal, true), tokenPrices[position.token.id]),
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
