import { PopulatedTransaction } from 'ethers';

import { LineStatusTypes, PositionStatusTypes, SpigotRevenueContract } from './CreditLine';
import { Address, Network } from './Blockchain';

// 0x API

// https://docs.0x.org/0x-api-swap/api-references/get-swap-v1-quote
export interface GetTradeQuoteProps {
  sellToken: string; // token symbol or address
  buyToken: string; // token symbol or address
  sellAmount?: string; // in sellToken decimals
  buyAmount?: string; // in buyToken decimals
  network?: Network;

  // optional protection fields
  slippagePercentage?: string;
  priceImpactProtectionPercentage?: string;
  enableSlippageProtection?: boolean;
}

export interface ZeroExAPIValidationError {
  reason: 'Validation Failed';
  validationErrors: {
    field: string; // field in order
    code: number;
    reason: string; // e.g. "INSUFFICIENT_ASSET_LIQUIDITY"
    description: string; // e.g. "We cant trade this token pair at the requested amount due to a lack of liquidity"}
  };
}

export interface ZeroExAPIQuoteResponse extends PopulatedTransaction, GetTradeQuoteProps {}

// Subgraph
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
 * @typedef {object} GetLineEventsArgs
 * @property {Address} GetLineEventsArgs.id - address of line contract
 */
export interface GetLineEventsArgs {
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
  id: Address;
  __typename: string;
  timestamp: number;
  position: {
    id: Address;
    token: TokenFragRepsonse;
  };
  // events with value
  value?: string;
  amount?: string;
  // events with rates
  dRate?: string;
  fRate?: string;
}

export interface SpigotRevenueSummaryFragResponse {
  token: TokenFragRepsonse;
  totalVolume: string;
  totalVolumeUsd: string;
  timeOfFirstIncome: number;
  timeOfLastIncome: number;
}

export interface SpigotRevenueContractFragResponse {
  id: Address;
  active: boolean;
  contract: Address;
  startTime: number;
  ownerSplit: number;
  escrowed: string;
  totalVolumeUsd: string;
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
  events?: EscrowEventFragResponse[];
}

export interface EscrowEventFragResponse {
  __typename: string;
  timestamp: number;
  // only on add/remove collateral
  amount?: string;
  value?: string;
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

export interface GetLineEventsResponse {
  events: LineEventFragResponse[];
  escrow: BaseEscrowFragResponse & {
    events: {
      __typename: string;
      timestamp: number;
      // only on add/remove collateral
      amount?: string;
      value?: string;
    };
  };
  spigot: {
    events?: SpigotEventFragResponse[];
    spigots: SpigotRevenueContractFragResponse[];
  };
}

export interface GetLinePageResponse extends BaseLineFragResponse {
  positions?: BasePositionFragResponse[];
  events?: LineEventFragResponse[];

  spigot?: {
    id: Address;
    summaries: SpigotRevenueSummaryFragResponse[];
    spigots: SpigotRevenueContractFragResponse[];
    // spigots: {
    //   contract: Address;
    //   active: boolean;
    //   startTime: number;
    // };
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
    spigots: SpigotRevenueContractFragResponse[];
    // spigots: {
    //   contract: Address;
    //   active: boolean;
    //   startTime: number;
    // };
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
