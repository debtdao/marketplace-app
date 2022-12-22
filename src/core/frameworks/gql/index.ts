import { ApolloClient, InMemoryCache, DocumentNode, QueryResult, HttpLink } from '@apollo/client';
import { at } from 'lodash';

import { getEnv } from '@config/env';
import { getConstants } from '@src/config/constants';
import {
  SecuredLine,
  GetLineArgs,
  GetLinePageArgs,
  GetLinesArgs,
  GetUserPortfolioArgs,
  GetUserPortfolioResponse,
  QueryResponse,
  QueryCreator,
  GetLinePageResponse,
  GetLinesResponse,
  SupportedOracleTokenResponse,
  CreditPosition,
  Network,
} from '@src/core/types';

import {
  GET_LINE_QUERY,
  GET_LINE_PAGE_QUERY,
  GET_LINE_PAGE_AUX_QUERY,
  GET_LINES_QUERY,
  GET_SUPPORTED_ORACLE_TOKENS_QUERY,
  GET_USER_PORTFOLIO_QUERY,
} from './queries';

// TODO: GRAPH_CHAINLINK_FEED_REGISTRY_API_URL
const { GRAPH_API_URL, GRAPH_TEST_API_URL, GRAPH_CHAINLINK_FEED_REGISTRY_API_URL } = getEnv();
const { BLACKLISTED_LINES: blacklist } = getConstants();

// utility function get GRAPH_API_URL based on network parameter
const getGraphURL = (network: string) => {
  // let url = '';
  let link: any;
  if (network === 'mainnet') {
    // url = GRAPH_API_URL!;
    link = new HttpLink({ uri: GRAPH_API_URL! });
  } else if (network === 'goerli') {
    // url = GRAPH_TEST_API_URL!;
    link = new HttpLink({ uri: GRAPH_TEST_API_URL! });
  }
  // return url;
  return link;
};

let client: any;
export const getClient = (network: string) => (client ? client : createClient(network));
const createClient = (network: string): typeof ApolloClient => {
  client = new ApolloClient({
    // uri: getGraphURL(network),
    link: getGraphURL(network),
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
  (query: DocumentNode, path?: string, network?: string, isOracle?: boolean): Function =>
  <A, R>(variables: A): Promise<QueryResponse<R>> =>
    new Promise(async (resolve, reject) => {
      const client = isOracle ? getPriceFeedClient() : getClient(network!);
      client
        .query({ query, variables })
        .then((result: QueryResult) => {
          console.log('gql result', result, query);
          const { data, error } = result;
          const requestedData = path ? at(data, [path])[0] : data;
          if (error) return reject(error);
          else return resolve(requestedData);
        })
        .catch((error: any) => {
          console.log('gql request error', error);
          reject(error);
        });
    });

const getLineQuery = createQuery(GET_LINE_QUERY);
export const getLine: QueryCreator<GetLineArgs, SecuredLine> = <GetLineArgs, SecuredLine>(
  arg: GetLineArgs
): QueryResponse<SecuredLine> => getLineQuery(arg);

const getLinePageQuery = createQuery(GET_LINE_PAGE_QUERY, 'lineOfCredit');
export const getLinePage: QueryCreator<GetLinePageArgs, GetLinePageResponse> = <GetLinePageArgs, GetLinePageResponse>(
  arg: GetLinePageArgs
): QueryResponse<GetLinePageResponse> => getLinePageQuery(arg);

const getLinesQuery = createQuery(GET_LINES_QUERY, 'lineOfCredits');
export const getLines: QueryCreator<GetLinesArgs, GetLinesResponse[]> = <GetLinesArgs, GetLinesResponse>(
  arg: GetLinesArgs
): QueryResponse<GetLinesResponse[]> => getLinesQuery({ ...arg, blacklist });

const getSupportedOracleTokensQuery = createQuery(GET_SUPPORTED_ORACLE_TOKENS_QUERY, undefined, undefined, true);
export const getSupportedOracleTokens: QueryCreator<
  undefined,
  SupportedOracleTokenResponse | undefined
> = (): QueryResponse<SupportedOracleTokenResponse | undefined> => getSupportedOracleTokensQuery();

const getUserPortfolioQuery = createQuery(GET_USER_PORTFOLIO_QUERY);
export const getUserPortfolio: QueryCreator<GetUserPortfolioArgs, GetUserPortfolioResponse> = (
  arg: GetUserPortfolioArgs
) => getUserPortfolioQuery(arg);
