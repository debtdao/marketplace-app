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
 * @property {string} Query.query - GraphQL query to send
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
 * @typedef {object} GetUserPortfolioArgs
 * @property {Address} GetUserPortfolioArgs.user - address to fetch borrower, lender, and arbiter portfolio
 */
export interface GetUserPortfolioArgs {
  user: Address;
}

// React hook args wrapping these queries
export interface UseCreditLinesParams {
  [key: string]: GetLinesArgs;
}

export interface UseCreditLineParams {
  id: Address;
}

/**
 * @typedef {object} GetSupportedOracleTokenArgs
 * @property {string} GetSupportedOracleTokenArgs.tokenAddress - oracle address to fetch supported tokens
 */
export interface GetSupportedOracleTokenArgs {
  oracleAddress: string;
}

/*
  Query Responses Types
*/
//type QueryResponseTypes = SecuredLine | SecuredLine[] | SecuredLineWithEvents;

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

export interface BasePositionFragResponse {
  id: Address;
  status: PositionStatusTypes;
  lender: {
    id: string;
  };
  line: {
    id: string;
  };
  principal: string;
  deposit: string;
  interestAccrued: string;
  interestRepaid: string;
  totalInterestRepaid: string;
  dRate: string;
  fRate: string;
  // arbiter: string;
  token: TokenFragRepsonse;
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
    positions: BasePositionFragResponse[];
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

export interface GetLinePageResponse extends BaseLineFragResponse {
  positions?: BasePositionFragResponse[];
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

export interface SupportedOracleTokenResponse {
  supportedTokens?: [token: TokenFragRepsonse];
}

export interface LenderPositionsResponse {
  positions?: BasePositionFragResponse[];
}

export interface LineOfCreditsResponse extends BaseLineFragResponse {
  positions?: BasePositionFragResponse[];

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
      amount?: string;
      value?: string;
    };
  };
}

export interface GetUserPortfolioResponse extends LineOfCreditsResponse, LenderPositionsResponse {
  borrowerLineOfCredits: LineOfCreditsResponse[];
  lenderPositions: LenderPositionsResponse;
  arbiterLineOfCredits: LineOfCreditsResponse[];
}
