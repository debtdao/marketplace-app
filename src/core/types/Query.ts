import { BaseCreditLine, CreditLinePage, BaseToken, Escrow, LinePageSpigot, LinePageCreditPosition } from '@types';

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
type QueryResponseTypes = BaseCreditLine | BaseCreditLine[] | CreditLinePage;

export interface LineFrag {
  id: string;
  __typename: string;
  timestamp: number;
  // events with value
  value?: number;
  amount?: number;
  // events with rates
  drawnRate?: number;
  facilityRate?: number;
}

export interface LineEventFrag {
  __typename: string;
  timestamp: number;
  credit: {
    id: string;
  };
  // events with value
  value?: number;
  amount?: number;
  // events with rates
  drawnRate?: number;
  facilityRate?: number;
}

export interface GetLinePageResponse {
  id: string;
  end: number;
  type: string;
  start: number;
  status: number;
  borrower: Address;

  credits?: LinePageCreditPosition &
    {
      // merge custom format w/ subgraph structure
      events?: {
        // cant use our type because we flatten structure for easier use
        __typename: string;
        timestamp: number;
        credit: {
          id: string;
        };
      }[];
    }[];

  escrow?: Escrow;
  spigot?: LinePageSpigot;
}
