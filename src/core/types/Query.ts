import { Address } from './Blockchain';

export interface QueryVariables {
  [key: string]: string;
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

type QueryArgOption = GetLineArgs | GetLinePageArgs | GetLinesArgs | undefined;
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

// React hook args wrapping these queries
export interface UseCreditLinesParams {
  [key: string]: GetLinesArgs;
}

export interface UseCreditLineParams {
  id: Address;
}
