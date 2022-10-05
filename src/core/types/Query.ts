import { BigNumber } from 'ethers';

import { LineStatusTypes, AggregatedCreditLine, CreditLinePage, BaseToken } from '@types';

import { Address } from './Blockchain';

export interface QueryCreator<ArgType, ResponseType> {
  (args: ArgType): QueryResponse<ResponseType>;
}

export interface QueryResponse<ResponseType> extends Promise<ResponseType> {
  loading: boolean;
  error?: string | object;
  data?: ResponseType;

  // make backwards compatible with Apollos response type
  [key: string]: any;
}

/**
 * @typedef {object} Query
 * @property {string} Query.query - GraohQL query to send
 * @property {object} Query.variables - params to input into query
 */
export interface Query {
  query: string;
  variables?: QueryArgOption;
}

export type QueryArgOption = GetLineArgs | GetLinePageArgs | GetLinesArgs | undefined;

// query props and return vals

/**
 * @typedef {object} GetLineArgs
 * @property {Address} GetLineArgs.id - address of line contract
 */
export interface GetLineArgs {
  id: Address;
}

/**
 * @typedef {object} GetLinePageArgs
 * @property {Address} GetLinePageArgs.id - address of line contract
 */
export interface GetLinePageArgs {
  id: Address;
}

/**
 * @typedef {object} GetLinesArgs
 * @property {number} GetLinesArgs.first - how many lines to get
 * @property {string} GetLinesArgs.orderBy - which property to sort on
 * @property {string} GetLinesArgs.orderDirection - if order is ascending or descending
 */
export interface GetLinesArgs {
  first: number;
  orderBy: string;
  orderDirection: 'asc' | 'desc';
}

/**
 * @typedef {object} GetUserLinePositionsArgs
 * @property {Address} GetUserLinePositionsArgs.id - address to look up credit.debit positions for
 */
export interface GetUserLinePositionsArgs {
  id: Address;
}

// React hook args wrapping these queries
export interface UseCreditLinesParams {
  [key: string]: GetLinesArgs;
}

export interface UseCreditLineParams {
  id: Address;
}

/*
  Query Responses Types
*/
type QueryResponseTypes = AggregatedCreditLine | AggregatedCreditLine[] | CreditLinePage;

export interface BaseLineFragResponse {
  id: Address;
  end: number;
  type: string;
  start: number;
  status: LineStatusTypes;
  borrower: {
    id: Address;
  };
}

export interface BaseCreditFragResponse {
  id: Address;
  principal: BigNumber;
  deposit: BigNumber;
  drate: BigNumber;
  token: {
    id: Address;
    symbol: string;
    decimals: number;
  };
}

export interface LinePageCreditFragResponse extends BaseCreditFragResponse {
  interestRepaid: BigNumber;
  interestAccrued: BigNumber;
  dRate: BigNumber;
  fRate: BigNumber;
}

export interface LineEventFrag {
  __typename: string;
  timestamp: number;
  credit: {
    id: string;
  };
  // events with value
  value?: BigNumber;
  amount?: BigNumber;
  // events with rates
  dRate?: BigNumber;
  fRate?: BigNumber;
}

export interface SpigotRevenueSummaryFragresponse {
  token: Address;
  totalVolumeUsd: BigNumber;
  timeOfFirstIncome: number;
  timeOfLastIncome: number;
}

export interface BaseEscrowDepositFragResponse {
  enabled: boolean;
  amount: BigInt;
  token: {
    id: Address;
    symbol: string;
    decimals: number;
  };
}

export interface BaseEscrowFragResponse {
  id: Address;
  minCRatio: BigNumber;
  deposits: BaseEscrowDepositFragResponse[];
}

export interface GetLinesResponse {
  lines: BaseLineFragResponse & {
    credits: BaseCreditFragResponse;
    escrow: BaseEscrowFragResponse;
    spigot: {
      id: Address;
      summaries: {
        totalVolumeUsd: BigNumber;
        timeOfFirstIncome: number;
        timeOfLastIncome: number;
      };
    };
  };
}

export interface GetLinePageResponse extends BaseLineFragResponse {
  credits?: LinePageCreditFragResponse & { events?: LineEventFrag[] }[];

  escrow?: {
    id: Address;
    cratio: BigNumber;
    minCRatio: BigNumber;
    collateralValue: BigNumber;
    deposits: {
      id: Address;
      token: BaseToken;
      amount: BigNumber;
      enabled: boolean;
      events: {
        __typename: string;
        timestamp: number;
        // only on add/remove collateral
        amount?: BigNumber;
        value?: BigNumber;
      };
    };
  };
  spigot?: {
    id: Address;
    spigots: {
      contract: Address;
      active: boolean;
      startTime: number;
    };
    events?: {
      __typename: 'ClaimRevenueEvent'; //only ever need revenue
      revenueToken: {
        id: Address;
        decimals: number;
        symbol: string;
      };
      timestamp: number;
      escrowed: BigNumber;
      netIncome: BigNumber;
      value: BigNumber;
    }[];
  };
}
