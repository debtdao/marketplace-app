import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

import { getEnv } from '@config/env';
import { GET_LINE_QUERY, GET_LINE_PAGE_QUERY, GET_LINES_QUERY } from '@config/constants/queries';
import { BaseCreditLine, CreditLine, GetLineArgs, GetLinePageArgs, GetLinesArgs } from '@src/core/types';

const {
  DEBT_DAO_SUBGRAPH_KEY,
  // DEBT_DAO_SUBGRAPH_NAME,
} = getEnv();

const APIURL = `https://api.studio.thegraph.com/query/${DEBT_DAO_SUBGRAPH_KEY}/debtdao/`; // <--SUBGRAPH_NAME here

let client: any;
const getClient = () => (client ? client : createClient());
const createClient = (): typeof ApolloClient => {
  client = new ApolloClient({
    uri: APIURL,
    cache: new InMemoryCache(),
  });

  return client;
};

// curried factory func to export funcs for each query that can be reused anywhere
// e.g. const getLine = createQuery(GET_LINE_QUERY); getLine({ id: "0x" });
// TODO: allow types to be passed in as args in createQuery so we dont need two lines of code for each function
// 1. for creating curried func and 2. for defining arg/return types of that func
export const createQuery =
  (query: string): Function =>
  (variables: any): Promise<any> => {
    return getClient().query({ query, variables });
  };

const getLineQuery = createQuery(GET_LINE_QUERY);
export const getLine = (arg: GetLineArgs): Promise<BaseCreditLine | undefined> => getLineQuery(arg);

const getLinePageQuery = createQuery(GET_LINE_PAGE_QUERY);
export const getLinePage = (arg: GetLinePageArgs): Promise<CreditLine | undefined> => getLinePageQuery(arg);

const getLinesQuery = createQuery(GET_LINES_QUERY);
export const getLines = (arg: GetLinesArgs): Promise<BaseCreditLine[] | undefined> => getLinesQuery(arg);
