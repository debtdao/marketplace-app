import { ApolloClient, InMemoryCache, gql, useQuery, DocumentNode, QueryResult } from '@apollo/client';

import { getEnv } from '@config/env';
import { GET_LINE_QUERY, GET_LINE_PAGE_QUERY, GET_LINES_QUERY } from '@config/constants/queries';
import {
  BaseCreditLine,
  CreditLine,
  GetLineArgs,
  GetLinePageArgs,
  GetLinesArgs,
  GetUserLinePositionsArgs,
  QueryResponse,
} from '@src/core/types';

const {
  DEBT_DAO_SUBGRAPH_KEY,
  // DEBT_DAO_SUBGRAPH_NAME,
} = getEnv();

const GQL_API_URL = `https://api.studio.thegraph.com/query/${DEBT_DAO_SUBGRAPH_KEY}/debtdao/`; // <--SUBGRAPH_NAME here

let client: any;
export const getClient = () => (client ? client : createClient());
const createClient = (): typeof ApolloClient => {
  client = new ApolloClient({
    uri: GQL_API_URL,
    cache: new InMemoryCache(),
  });

  return client;
};

/**
 * @desc - curried factory func to export funcs for each query that can be reused anywhere
 * @example - const getLine = createQuery(GET_LINE_QUERY); getLine({ id: "0x" });
 * @param query - string of graph query
 * @returns {
 *  loading?: boolean; if request has completed or not
 *  error?: object; JS error object?
 *  data?: response data formatted to submitted query
 * }
 * @dev - TODO: allow types to be passed in as args in createQuery so we dont need two lines of code for each function
 *        1. for creating curried func and 2. for defining arg/return types of that func
 */
export const createQuery =
  (query: DocumentNode): Function =>
  (variables: any): QueryResponse =>
    useQuery(query, { variables });

const getLineQuery = createQuery(GET_LINE_QUERY);
export const getLine = (arg: GetLineArgs): Promise<QueryResponse> => getLineQuery(arg);

const getLinePageQuery = createQuery(GET_LINE_PAGE_QUERY);
export const getLinePage = (arg: GetLinePageArgs): Promise<QueryResponse> => getLinePageQuery(arg);

const getLinesQuery = createQuery(GET_LINES_QUERY);
export const getLines = (arg: GetLinesArgs): Promise<QueryResponse> => getLinesQuery(arg);

const getUserLinePositionsQuery = createQuery(GET_LINES_QUERY);
export const getUserLinePositions = (arg: GetUserLinePositionsArgs): Promise<QueryResponse> =>
  getUserLinePositionsQuery(arg);
