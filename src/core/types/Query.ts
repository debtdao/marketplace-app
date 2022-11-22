import { LineStatusTypes, PositionStatusTypes } from '@types';

import { Address } from './Blockchain';

export interface QueryCreator<ArgType, ResponseType> {
  (args: ArgType): QueryResponse<ResponseType>;
}

export interface QueryResponse<ResponseType> extends Promise<ResponseType> {
  loading: boolean;
  error?: string | object;
  data?: ResponseType | undefined;

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

export interface GetLinePageAuxArgs {
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

export interface GetBorrowerPositionsArgs {
  borrower: Address;
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
//type QueryResponseTypes = AggregatedCreditLine | AggregatedCreditLine[] | CreditLinePage;

export interface TokenFragRepsonse {
  id: Address;
  name: string;
  symbol: string;
  decimals: number;
}
export interface BaseLineFragResponse {
  id: Address;
  end: number;
  type: string;
  start: number;
  status: LineStatusTypes;
  arbiter: Address;
  borrower: {
    id: Address;
  };
}

export interface BaseCreditFragResponse {
  id: Address;
  status: PositionStatusTypes;
  principal: string;
  deposit: string;
  dRate: string;
  fRate: string;
  arbiter: string;
  token: TokenFragRepsonse;
}

export interface LinePageCreditFragResponse extends BaseCreditFragResponse {
  status: PositionStatusTypes;
  interestRepaid: string;
  interestAccrued: string;
  dRate: string;
  fRate: string;

  lender: {
    id: string;
  };

  events?: LineEventFragResponse[];
}

export interface LineEventFragResponse {
  __typename: string;
  id: string;
  timestamp: number;
  position: {
    id: string;
  };
  // events with value
  value?: string;
  amount?: string;
  // events with rates
  dRate?: string;
  fRate?: string;

  token: TokenFragRepsonse;
}

export interface SpigotRevenueSummaryFragResponse {
  token: Address;
  totalVolumeUsd: string;
  timeOfFirstIncome: number;
  timeOfLastIncome: number;
}

export interface SpigotEventFragResponse {
  __typename: 'ClaimRevenueEvent';
  timestamp: number;
  revenueToken: TokenFragRepsonse;
  escrowed: string;
  netIncome: string;
  value: string;
}

export interface BaseEscrowDepositFragResponse {
  enabled: boolean;
  amount: string;
  token: TokenFragRepsonse;
}

export interface BaseEscrowFragResponse {
  id: Address;
  minCRatio: string;
  deposits: BaseEscrowDepositFragResponse[];
}

export interface GetLinesResponse {
  lines: BaseLineFragResponse & {
    positions: BaseCreditFragResponse[];
    escrow: BaseEscrowFragResponse;
    spigot: {
      id: Address;
      summaries: {
        totalVolumeUsd: string;
        timeOfFirstIncome: number;
        timeOfLastIncome: number;
      };
    };
  };
}

export interface GetLinePageAuxDataResponse {
  events?: LineEventFragResponse[];
  spigot?: {
    events: SpigotEventFragResponse[];
  };
}

export interface GetLinePageResponse extends BaseLineFragResponse {
  positions?: LinePageCreditFragResponse[];

  spigot?: {
    id: Address;
    summaries: SpigotRevenueSummaryFragResponse[];
    spigots: {
      contract: Address;
      active: boolean;
      startTime: number;
    };
    events?: SpigotEventFragResponse[];
  };
  escrow?: BaseEscrowFragResponse & {
    events: {
      __typename: string;
      timestamp: number;
      // only on add/remove collateral
      amount?: string;
      value?: string;
    };
  };
}

export interface GetBorrowerPositionsResponse extends BaseLineFragResponse {
  positions?: LinePageCreditFragResponse[];

  events?: LineEventFragResponse[];

  spigot?: {
    id: Address;
    summaries: SpigotRevenueSummaryFragResponse[];
    spigots: {
      contract: Address;
      active: boolean;
      startTime: number;
    };
    events?: SpigotEventFragResponse[];
  };

  escrow?: BaseEscrowFragResponse & {
    events: {
      __typename: string;
      timestamp: number;
      // only on add/remove collateral
      amount?: string;
      value?: string;
    };
  };
}
