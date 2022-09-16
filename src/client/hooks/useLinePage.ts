import { useEffect, useState } from 'react';
import { isEqual } from 'lodash';

import { getEnv } from '@src/config/env';
import { getLinePage } from '@core/frameworks/gql';
import {
  CreditLinePage,
  GetLinePageArgs,
  UseCreditLineParams,
  CollateralEvent,
  CreditLineEvents,
  ModuleNames,
  Spigot,
  Address,
  SPIGOT_MODULE_NAME,
  ESCROW_MODULE_NAME,
  CREDIT_MODULE_NAME,
} from '@src/core/types';

import { useSelectedCreditLine } from './useSelectedCreditLine';

export const useLinePage = ({ id }: UseCreditLineParams): [CreditLinePage | undefined, Function] => {
  const [pageData, setLinePageData] = useState<CreditLinePage | undefined>();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [args, setId] = useState<Address>(id);

  useEffect(() => {
    if (isEqual(id, args)) return;
    setLoading(true);

    getLinePage({ id })
      .then((response: any) => {
        console.log('get lines category res: ', id, response.data);
        const { start, end, status, borrower, credits, spigot, escrow } = response.data;

        // dreivative or aggregated data we need to compute and store while mapping position data

        // position id and APY
        const highestApy: [string, number] = ['', 0];
        // aggregated revenue in USD by token across all spigots
        const tokenRevenue: { [key: string]: number } = {};
        const principal = 0;
        const interest = 0;

        //  all recent Spigot and Escrow events
        let collateralEvents: CollateralEvent[] = [];
        /**
         * @function
         * @name mergeCollateralEvents
         * @desc - takes all events for a single deposit/spigot and merges them into global list
         * @dev  - expects all events to be in the same token
         * @param type - the type of module used as collateral
         * @param symbol - the token in event
         * @param price - the price to use for events. Generally current price for escrow and time of event for spigot
         * @param events - the events to process
         */
        const mergeCollateralEvents = (
          type: ModuleNames,
          symbol: string,
          price: number = 0,
          events: CollateralEvent[]
        ) => {
          let totalVal = 0;
          const newEvents: CollateralEvent[] = events.map((e: any): CollateralEvent => {
            const value = price * e.amount;
            if (type === SPIGOT_MODULE_NAME) {
              // aggregate token revenue. not needed for escrow bc its already segmented by token
              // use price at time of revenue for more accuracy
              tokenRevenue[symbol] += value;
            }
            totalVal += value;
            return {
              type,
              timestamp: e.timestamp,
              symbol: symbol || 'UNKNOWN',
              amount: e.amount,
              value,
            };
          });

          collateralEvents = [...collateralEvents, ...newEvents];
          return totalVal;
        };

        //  all recent borrow/lend events
        let creditEvents: CreditLineEvents[] = [];
        /**
         * @function
         * @name mergeCollateralEvents
         * @desc - takes all events for a single deposit/spigot and merges them into global list
         * @dev  - expects all events to be in the same token
         * @param type - the type of module used as collateral
         * @param symbol - the token in event
         * @param price - the price to use for events. Generally current price for escrow and time of event for spigot
         * @param events - the events to process
         */
        const mergeCreditEvents = (symbol: string, price: number = 0, events: CreditLineEvents[]) => {
          const newEvents: CreditLineEvents[] = events.map((e: any): CreditLineEvents => {
            const { id, __typename, amount, timestamp, value: val } = e;
            let value = amount * price;
            if (__typename === 'InterestRepaidEvent') {
              // only use value at time of repayment for repayment events
              // use current price for all other events
              value = val;
            }

            return {
              id,
              timestamp,
              symbol: symbol || 'UNKNOWN',
              amount,
              value,
            };
          });

          // TODO promise.all token price fetching for better performance

          creditEvents = [...creditEvents, ...newEvents];
        };

        const pageData: CreditLinePage = {
          // metadata
          id,
          start,
          end,
          status,
          borrower,
          // debt data
          principal,
          interest,
          credits: credits.reduce((obj: any, c: any) => {
            const { deposit, drawnRate, id, lender, symbol, events, principal, interest, interestRepaid, token } = c;
            // const currentPrice = await fetchTokenPrice(symbol, Date.now())
            const currentPrice = 1e8;
            mergeCreditEvents(c.token.symbol, currentPrice, events);
            return {
              ...obj,
              [id]: {
                id,
                lender,
                deposit,
                drawnRate,
                principal,
                interest,
                interestRepaid,
                token,
              },
            };
          }),
          // collateral data
          spigot: spigot?.id
            ? undefined
            : {
                revenue: tokenRevenue,
                spigots: spigot.spigots.reduce((obj: any, s: any): { [key: string]: Spigot } => {
                  const {
                    id,
                    token: { symbol, lastPriceUSD },
                    active,
                    contract,
                    startTime,
                    events,
                  } = s;
                  mergeCollateralEvents(SPIGOT_MODULE_NAME, symbol, lastPriceUSD, events); // normalize and save events
                  return { ...obj, [id]: { active, contract, symbol, startTime, lastPriceUSD } };
                }, {}),
              },
          escrow: escrow?.id
            ? undefined
            : {
                deposits: escrow.deposits.reduce((obj: any, d: any) => {
                  const {
                    id,
                    amount,
                    enabled,
                    token: { symbol },
                    events,
                  } = d;
                  // TODO promise.all token price fetching for better performance
                  // const currentUsdPrice = await fetchTokenPrice(symbol, Datre.now());
                  const currentUsdPrice = 1e8;
                  mergeCollateralEvents(ESCROW_MODULE_NAME, symbol, currentUsdPrice, events); // normalize and save events
                  return { ...obj, [id]: { symbol, currentUsdPrice, amount, enabled } };
                }, {}),
              },
          // all recent events
          collateralEvents,
          creditEvents,
        };

        setLinePageData(pageData);
        setLoading(false);
        return;
      })
      .catch((err) => {
        console.log('err useLinePage', err);
        setLoading(false);
        return;
      });
  }, [id]);

  return [pageData, setId];
};
