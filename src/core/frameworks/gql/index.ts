import { ApolloClient, InMemoryCache, DocumentNode, QueryResult } from '@apollo/client';
import { at } from 'lodash';

import { getEnv } from '@config/env';
import { getConstants } from '@src/config/constants';
import {
  AggregatedCreditLine,
  GetLineArgs,
  GetLinePageArgs,
  GetLinesArgs,
  GetUserLinePositionsArgs,
  GetBorrowerPositionsArgs,
  QueryResponse,
  QueryCreator,
  GetLinePageResponse,
  GetLinePageAuxDataResponse,
  GetBorrowerPositionsResponse,
  GetLinesResponse,
  SupportedOracleTokenResponse,
  CreditPosition,
} from '@src/core/types';

import {
  GET_LINE_QUERY,
  GET_LINE_PAGE_QUERY,
  GET_LINE_PAGE_AUX_QUERY,
  GET_LINES_QUERY,
  GET_SUPPORTED_ORACLE_TOKENS_QUERY,
  GET_BORROWER_POSITIONS_QUERY,
} from './queries';

const { GRAPH_API_URL, GRAPH_CHAINLINK_FEED_REGISTRY_API_URL } = getEnv();
const { BLACKLISTED_LINES: blacklist } = getConstants();

let client: any;
export const getClient = () => (client ? client : createClient());
const createClient = (): typeof ApolloClient => {
  client = new ApolloClient({
    uri: GRAPH_API_URL,
    cache: new InMemoryCache(),
  });
  return client;
};

let priceFeedClient: any;
export const getPriceFeedClient = (isOracle?: boolean) =>
  priceFeedClient ? priceFeedClient : createPriceFeedClient(isOracle);
const createPriceFeedClient = (isOracle?: boolean): typeof ApolloClient => {
  priceFeedClient = new ApolloClient({
    uri: GRAPH_CHAINLINK_FEED_REGISTRY_API_URL,
    cache: new InMemoryCache(),
  });
  return priceFeedClient;
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
  (query: DocumentNode, path?: string, isOracle?: boolean): Function =>
  <A, R>(variables: A): Promise<QueryResponse<R>> =>
    new Promise(async (resolve, reject) => {
      if (isOracle === undefined) {
        getClient()
          .query({ query, variables })
          .then((result: QueryResult) => {
            const { data, error } = result;
            const requestedData = path ? at(data, [path])[0] : data;
            if (error) return reject(error);
            else return resolve(requestedData);
          })
          .catch((error: any) => {
            console.log('TokenService gql request error', error);
            reject(error);
          });
      } else {
        getPriceFeedClient()
          .query({ query, variables })
          .then((result: QueryResult) => {
            const { data, error } = result;
            const requestedData = path ? at(data, [path])[0] : data;
            if (error) return reject(error);
            else return resolve(requestedData);
          })
          .catch((error: any) => {
            console.log('TokenService gql request error', error);
            reject(error);
          });
      }
    });

const getLineQuery = createQuery(GET_LINE_QUERY);

export const getLine: QueryCreator<GetLineArgs, AggregatedCreditLine> = <GetLineArgs, AggregatedCreditLine>(
  arg: GetLineArgs
): QueryResponse<AggregatedCreditLine> => getLineQuery(arg);

const getLinePageQuery = createQuery(GET_LINE_PAGE_QUERY, 'lineOfCredit');
export const getLinePage: QueryCreator<GetLinePageArgs, GetLinePageResponse> = <GetLinePageArgs, GetLinePageResponse>(
  arg: GetLinePageArgs
): QueryResponse<GetLinePageResponse> => getLinePageQuery(arg);

const getLinePageAuxDataQuery = createQuery(GET_LINE_PAGE_AUX_QUERY);
export const getLinePageAuxData: QueryCreator<GetLinePageArgs, GetLinePageAuxDataResponse> = <
  GetLinePageArgs,
  GetLinePageResponse
>(
  arg: GetLinePageArgs
): QueryResponse<GetLinePageResponse> => getLinePageAuxDataQuery(arg);

const getLinesQuery = createQuery(GET_LINES_QUERY, 'lineOfCredits');
export const getLines: QueryCreator<GetLinesArgs, GetLinesResponse[]> = <GetLinesArgs, GetLinesResponse>(
  arg: GetLinesArgs
): QueryResponse<GetLinesResponse[]> => getLinesQuery({ ...arg, blacklist });

const getUserLinePositionsQuery = createQuery(GET_LINES_QUERY);
export const getUserLinePositions: QueryCreator<GetUserLinePositionsArgs, CreditPosition[]> = <
  GetUserLinePositionsArgs
>(
  arg: GetUserLinePositionsArgs
) => getUserLinePositionsQuery(arg);

const getSupportedOracleTokensQuery = createQuery(GET_SUPPORTED_ORACLE_TOKENS_QUERY, undefined, true);
export const getSupportedOracleTokens: QueryCreator<
  undefined,
  SupportedOracleTokenResponse | undefined
> = (): QueryResponse<SupportedOracleTokenResponse | undefined> => getSupportedOracleTokensQuery();

const getBorrowerPositionsQuery = createQuery(GET_BORROWER_POSITIONS_QUERY, 'lineOfCredits');
export const getBorrowerPositions: QueryCreator<GetBorrowerPositionsArgs, CreditPosition[]> = (
  arg: GetBorrowerPositionsArgs
) => getBorrowerPositionsQuery(arg);
