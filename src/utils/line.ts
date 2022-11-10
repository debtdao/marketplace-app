import { isEmpty } from 'lodash';
import { BigNumber, utils } from 'ethers';

import {
  CreditLinePage,
  AggregatedCreditLine,
  CreditEvent,
  CollateralEvent,
  ModuleNames,
  ESCROW_MODULE_NAME,
  SPIGOT_MODULE_NAME,
  LineStatusTypes,
  UNINITIALIZED_STATUS,
  ACTIVE_STATUS,
  LIQUIDATABLE_STATUS,
  REPAID_STATUS,
  INSOLVENT_STATUS,
  NO_STATUS,
  GetLinePageResponse,
  GetLinesResponse,
  BaseCreditFragResponse,
  BaseEscrowDepositFragResponse,
  SpigotRevenueSummaryFragResponse,
  Address,
  GetLinePageAuxDataResponse,
  LinePageCreditFragResponse,
  LineEventFragResponse,
  SpigotEventFragResponse,
  EscrowDeposit,
  EscrowDepositList,
  TokenFragRepsonse,
  COLLATERAL_TYPE_REVENUE,
  Collateral,
  COLLATERAL_TYPE_ASSET,
  CreditPosition,
  LinePageCreditPosition,
} from '@types';

import { format, humanize } from './format';

const { parseUnits, parseEther } = utils;

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
): AggregatedCreditLine[] {
  return response.map((data: any) => {
    const {
      borrower: { id: borrower },
      positions,
      escrow: escrowRes,
      spigot: spigotRes,
      status,
      ...rest
    } = data;
    const { credit, spigot, escrow } = formatAggregatedCreditLineData(
      positions,
      escrowRes?.deposits ?? [],
      spigotRes?.revenues ?? [],
      tokenPrices
    );

    const deposits = escrowRes?.deposits.map((d: any) => ({ ...d, token: d.token.id }));
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

export function formatGetLinePageAuxData(
  response: GetLinePageAuxDataResponse,
  line: AggregatedCreditLine,
  tokenPrices: { [token: string]: BigNumber }
): GetLinePageAuxDataResponse | undefined {
  const { ...rest } = response;
  // TODO for Line Page
  return;
}

export const formatAggregatedCreditLineData = (
  positions: (BaseCreditFragResponse | LinePageCreditFragResponse)[],
  collateralDeposits: BaseEscrowDepositFragResponse[],
  revenues: SpigotRevenueSummaryFragResponse[],
  tokenPrices: { [token: string]: BigNumber }
): {
  credit: {
    highestApy: [string, string, string];
    principal: string;
    deposit: string;
  };
  spigot: { tokenRevenue: { [key: string]: string } };
  escrow: {
    collateralValue: string;
    cratio: string;
    deposits: EscrowDepositList;
    // TODO add formated deposits here
  };
} => {
  // derivative or aggregated data we need to compute and store while mapping position data

  // position id, token address, APY
  const highestApy: [string, string, string] = ['', '', '0'];

  const principal = BigNumber.from(0);
  const deposit = BigNumber.from(0);

  const credit = positions.reduce(
    (agg: any, c) => {
      const price = tokenPrices[c.token?.id] || BigNumber.from(0);
      // const highestApy = BigNumber.from(c.dRate).gt(BigNumber.from(agg.highestApy[2]))
      //   ? [c.id, c.token?.id, c.dRate]
      //   : agg.highestApy;
      return {
        principal: agg.principal.add(price.mul(unnullify(c.principal).toString())),
        deposit: agg.deposit.add(price.mul(unnullify(c.deposit).toString())),
        highestApy,
      };
    },
    { principal, deposit, highestApy }
  );

  const [collateralValue, deposits]: [BigNumber, EscrowDepositList] = collateralDeposits.reduce(
    (agg, c) => {
      const price = unnullify(tokenPrices[c.token.id], true);
      return !c.enabled
        ? agg
        : [
            agg[0].add(parseUnits(unnullify(c.amount).toString(), 'ether').mul(price)),
            {
              ...agg[1],
              [c.token.id]: {
                ...c,
                type: COLLATERAL_TYPE_ASSET,
                token: _createTokenView(c.token, BigNumber.from(c.amount), price),
              },
            },
          ];
    },
    [BigNumber.from(0), {}]
  );

  const escrow = {
    deposits,
    collateralValue: collateralValue.toString(),
    cratio: parseUnits(unnullify(credit.principal).toString(), 'ether').eq(0)
      ? '0'
      : collateralValue.div(unnullify(credit.principal).toString()).toString(),
  };

  // aggregated revenue in USD by token across all spigots
  const tokenRevenue: { [key: string]: string } = revenues.reduce((ggg, r) => {
    return { ...r, [r.token]: (r.totalVolumeUsd ?? '0').toString() };
  }, {});

  return {
    credit: {
      highestApy,
      principal: parseUnits(unnullify(credit.principal), 'ether').toString(),
      deposit: parseUnits(unnullify(credit.deposit), 'ether').toString(),
    },
    escrow,
    spigot: { tokenRevenue },
  };
};

export const formatLinePageData = (
  lineData: GetLinePageResponse,
  tokenPrices: { [token: string]: BigNumber }
): CreditLinePage => {
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
  const {
    credit,
    spigot: spigotData,
    escrow: escrowData,
  } = formatAggregatedCreditLineData(positions!, escrow?.deposits || [], spigot?.summaries || [], tokenPrices);
  const lineAddress = metadata.id;

  console.log('get line page escrow', escrow, escrowData);

  // derivative or aggregated data we need to compute and store while mapping position data

  // position id and APY
  const highestApy: [string, string, string] = ['', '', '0'];

  // aggregated revenue in USD by token across all spigots
  const totalPrincipalUsd = BigNumber.from(0);
  const totalDepositUsd = BigNumber.from(0);
  const totalInterestOwed = BigNumber.from(0);
  const totalInterestRepaid = BigNumber.from(0);
  //  all recent Spigot and Escrow events
  let collateralEvents: CollateralEvent[] = [];
  //  all recent borrow/lend events
  const creditEvents: CreditEvent[] = [];

  const formattedPositions = positions?.reduce<LinePageCreditPosition[]>(
    (list: any[], c: LinePageCreditFragResponse) => {
      const { lender, events: graphEvents, principal, deposit, token, ...metadata } = c;

      const currentUsdPrice = unnullify(tokenPrices[token.id], true);
      const principalUsd = totalPrincipalUsd.add(currentUsdPrice.mul(principal));
      const depositUsd = totalDepositUsd.add(currentUsdPrice.mul(deposit));
      const events = graphEvents ? formatCreditEvents(token.symbol, currentUsdPrice, graphEvents!) : [];
      creditEvents.concat(events);
      return [
        ...list,
        {
          ...metadata,
          lender: lender.id,
          deposit,
          principal,
          token: _createTokenView(token, BigNumber.from(principal), currentUsdPrice),
          events,
        },
      ];
    },
    []
  );

  // TODO add spigot events to collateralEvents
  // TODO add escrow events to collateralEvents
  //   const currentUsdPrice = tokenPrices[tokenId];
  //   formatCollateralEvents(ESCROW_MODULE_NAME, symbol, currentUsdPrice, events); // normalize and save events

  console.log('test position', positions, formattedPositions);

  const formattedSpigot = {
    ...spigot!,
    ...spigotData,
  };

  const pageData: CreditLinePage = {
    // metadata
    ...metadata,
    status: status.toLowerCase() as LineStatusTypes,
    borrower: borrower.id,
    // todo add UsePositionMetadata,
    // debt data
    principal: totalPrincipalUsd.toString(),
    deposit: totalDepositUsd.toString(),
    interest: totalInterestOwed.toString(),
    totalInterestRepaid: totalInterestRepaid.toString(),
    highestApy: highestApy.map((s) => s.toString()) as [string, string, string],
    // all recent events
    collateralEvents,
    creditEvents,
    positions: formattedPositions,
    // collateral data
    spigot: formattedSpigot,
    escrow: isEmpty(escrow?.deposits) ? undefined : { ...escrow!, ...escrowData },
  };
  console.log('page data', pageData);
  return pageData;
};

export const _createTokenView = (tokenResponse: TokenFragRepsonse, amount?: BigNumber, price?: BigNumber) => {
  // might already have for token in state but we only pass in prices to these util functions
  // will need to merge and prefer state vs this jank
  console.log('create token', tokenResponse, amount, price);
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
