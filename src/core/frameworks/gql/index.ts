import { ApolloClient, InMemoryCache, DocumentNode, QueryResult } from '@apollo/client';
import { at } from 'lodash';

import { getEnv } from '@config/env';
import { getConstants } from '@src/config/constants';
import {
  SecuredLine,
  GetLineArgs,
  GetLinePageArgs,
  GetLinesArgs,
  GetLineEventsArgs,
  GetUserPortfolioArgs,
  GetUserPortfolioResponse,
  QueryResponse,
  QueryCreator,
  GetLinePageResponse,
  GetLinesResponse,
  LineEventFragResponse,
  GetLineEventsResponse,
  SupportedOracleTokenResponse,
  CreditPosition,
  Network,
} from '@src/core/types';

import {
  GET_LINE_QUERY,
  GET_LINE_PAGE_QUERY,
  GET_LINE_EVENTS_QUERY,
  GET_LINES_QUERY,
  GET_SUPPORTED_ORACLE_TOKENS_QUERY,
  GET_USER_PORTFOLIO_QUERY,
} from './queries';
import { possibleTypes } from './possibleTypes.js';

const fetch = require('cross-fetch');

// TODO: GRAPH_CHAINLINK_FEED_REGISTRY_API_URL

const { MAINNET_GRAPH_API_URL, GOERLI_GRAPH_API_URL, GNOSIS_GRAPH_API_URL, GRAPH_CHAINLINK_FEED_REGISTRY_API_URL } =
  getEnv();
const { BLACKLISTED_LINES: blacklist } = getConstants();

// utility function get MAINNET_GRAPH_API_URL based on network parameter
const getGraphURL = (network: Network) => {
  if (network === 'mainnet') {
    return MAINNET_GRAPH_API_URL;
  } else if (network === 'goerli') {
    return GOERLI_GRAPH_API_URL;
  } else if (network === 'gnosis') {
    return GNOSIS_GRAPH_API_URL;
  }
};

const clients: { [key: string]: ApolloClient<{}> | null } = {
  mainnet: null,
  goerli: null,
  gnosis: null,
};

export const getClient = (network: Network): ApolloClient<{}> =>
  clients[network] ? clients[network]! : createClient(network);
const createClient = (network: string): ApolloClient<{}> => {
  const graphApiUrL = getGraphURL(network);
  clients[network] = new ApolloClient({
    uri: graphApiUrL,
    cache: new InMemoryCache({
      possibleTypes,
    }),
  });
  return clients[network]!;
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
  <A, R>(network: string, variables: A): Promise<QueryResponse<R>> =>
    new Promise(async (resolve, reject) => {
      const client = isOracle ? getPriceFeedClient() : getClient(network);
      client
        .query({ query, variables })
        .then((result: QueryResult) => {
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
  arg: any
): QueryResponse<SecuredLine> => getLineQuery(arg.network, arg);

const getLinePageQuery = createQuery(GET_LINE_PAGE_QUERY, 'lineOfCredit');
export const getLinePage: QueryCreator<GetLinePageArgs, GetLinePageResponse> = <GetLinePageArgs, GetLinePageResponse>(
  arg: any
): QueryResponse<GetLinePageResponse> => getLinePageQuery(arg.network, arg);

const getLinesQuery = createQuery(GET_LINES_QUERY, 'lineOfCredits');
export const getLines: QueryCreator<GetLinesArgs, GetLinesResponse[]> = <GetLinesArgs, GetLinesResponse>(
  arg: any
): QueryResponse<GetLinesResponse[]> => getLinesQuery(arg.network, { ...arg, blacklist });

const getLineEventsQuery = createQuery(GET_LINE_EVENTS_QUERY, 'lineOfCredit');
export const getLineEvents: QueryCreator<GetLineEventsArgs, GetLineEventsResponse> = <
  GetLineEventsArgs,
  GetLineEventsResponse
>(
  arg: any
): QueryResponse<GetLineEventsResponse> => getLineEventsQuery(arg.network, arg);

const getSupportedOracleTokensQuery = createQuery(GET_SUPPORTED_ORACLE_TOKENS_QUERY, undefined, true);
export const getSupportedOracleTokens: QueryCreator<
  undefined,
  SupportedOracleTokenResponse | undefined
> = (): QueryResponse<SupportedOracleTokenResponse | undefined> => getSupportedOracleTokensQuery();

const getUserPortfolioQuery = createQuery(GET_USER_PORTFOLIO_QUERY);
export const getUserPortfolio: QueryCreator<GetUserPortfolioArgs, GetUserPortfolioResponse> = (arg: any) =>
  getUserPortfolioQuery(arg.network, arg);
