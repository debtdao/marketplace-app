import * as fs from 'fs';
import * as path from 'path';

import { ApolloClient, InMemoryCache, DocumentNode, QueryResult, HttpLink, ApolloLink } from '@apollo/client';
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
import possibleSubgraphTypes from './possibleTypes.json';

const fetch = require('cross-fetch');
// import * as fetch from 'cross-fetch';

// TODO: GRAPH_CHAINLINK_FEED_REGISTRY_API_URL
const { GRAPH_API_URL, GRAPH_TEST_API_URL, GRAPH_CHAINLINK_FEED_REGISTRY_API_URL } = getEnv();
const { BLACKLISTED_LINES: blacklist } = getConstants();

// utility function get GRAPH_API_URL based on network parameter
const getGraphURL = (network: string) => {
  let link: any;
  if (network === 'mainnet') {
    link = new HttpLink({ uri: GRAPH_API_URL! });
  } else if (network === 'goerli') {
    link = new HttpLink({ uri: GRAPH_TEST_API_URL! });
  }
  return link;
};

type PossibleTypeMap = {
  [supertype: string]: string[];
};

const generateSubgraphTypes = async (url: string): Promise<PossibleTypeMap> => {
  const homeDirectory = path.resolve(process.cwd());
  const destinationDirectory = '/src/core/frameworks/gql/possibleSubgraphTypes.json';
  const destinationPath = path.join(homeDirectory, destinationDirectory);
  console.log('path home: ', homeDirectory);
  console.log('path destination: ', destinationPath);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      variables: {},
      query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
    }),
  })
    .then((result: Response) => result.json())
    .then((result: any) => {
      const possibleTypes: { [key: string]: string[] } = {};

      result.data.__schema.types.forEach((supertype: any) => {
        if (supertype.possibleTypes) {
          possibleTypes[supertype.name] = supertype.possibleTypes.map((subtype: any) => subtype.name);
        }
      });
      console.log('successful processing? ', result);
      console.log('successful processing possibleTypes? ', possibleTypes);
      // write file in backup directory
      // fs.writeFile(destinationPath, JSON.stringify(possibleTypes), (err) => {
      //   if (err) {
      //     console.error('Error writing possibleTypes.json', err);
      //   } else {
      //     console.log('Fragment types successfully extracted!');
      //   }
      // });

      // // write file in backup directory
      // fs.writeFileSync(destinationPath, JSON.stringify(possibleTypes));
      // console.log('Fragment types successfully extracted!');

      console.log('possible types - function: ', possibleTypes);

      return possibleTypes;
    })
    .catch((error: any) => {
      console.error('Error generating subgraph types:', error);
    });
};

let client: any;
export const getClient = (network: string) => (client ? client : createClient(network));
// const createClient = async (network: string): Promise<typeof ApolloClient> => {
const createClient = (network: string): typeof ApolloClient => {
  const GRAPH_API_URL_LINK = getGraphURL(network);
  console.log('GRAPH API URL: ', GRAPH_API_URL_LINK);
  // const possibleTypes = await generateSubgraphTypes(GRAPH_API_URL_LINK.options.uri); //??possibleSubgraphTypes;
  // console.log('possible types - prev generated: ', possibleSubgraphTypes);
  // console.log('possible types - newly created: ', possibleTypes);
  client = new ApolloClient({
    link: GRAPH_API_URL_LINK,
    cache: new InMemoryCache({
      possibleTypes: possibleSubgraphTypes, // ?? possibleTypes,
    }),
  });
  // console.log('possible types - client: ', client);
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

const getLineEventsQuery = createQuery(GET_LINE_EVENTS_QUERY, 'lineOfCredit');
export const getLineEvents: QueryCreator<GetLineEventsArgs, GetLineEventsResponse> = <
  GetLineEventsArgs,
  GetLineEventsResponse
>(
  arg: GetLineEventsArgs
): QueryResponse<GetLineEventsResponse> => getLineEventsQuery(arg);

const getSupportedOracleTokensQuery = createQuery(GET_SUPPORTED_ORACLE_TOKENS_QUERY, undefined, undefined, true);
export const getSupportedOracleTokens: QueryCreator<
  undefined,
  SupportedOracleTokenResponse | undefined
> = (): QueryResponse<SupportedOracleTokenResponse | undefined> => getSupportedOracleTokensQuery();

const getUserPortfolioQuery = createQuery(GET_USER_PORTFOLIO_QUERY);
export const getUserPortfolio: QueryCreator<GetUserPortfolioArgs, GetUserPortfolioResponse> = (
  arg: GetUserPortfolioArgs
) => getUserPortfolioQuery(arg);
