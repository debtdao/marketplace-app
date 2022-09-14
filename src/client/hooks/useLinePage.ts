import { useEffect, useState } from 'react';
import { isEqual } from 'lodash';

import { getEnv } from '@src/config/env';
import { getLinePage } from '@core/frameworks/gql';
import {
  CreditLinePage,
  GetLinePageArgs,
  UseCreditLineParams,
  CollateralEvent,
  CreditEvent,
  EscrowTypes,
  Spigot,
} from '@src/core/types';

import { useSelectedCreditLine } from './useSelectedCreditLine';

export const useLinePage = (id: UseCreditLineParams): [CreditLinePage | undefined, Function] => {
  const [pageData, setLinePageData] = useState<CreditLinePage | undefined>();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [args, setId] = useState<UseCreditLineParams>(id);

  useEffect(() => {
    if (isEqual(id, args)) return;
    setLoading(true);

    getLinePage(id)
      .then((response: any) => {
        console.log('get lines category res: ', id, response.data);
        const { start, end, status, borrower, credits, spigot, escrow } = response.data;

        // dreivative or aggregated data we need to compute and store while mapping position data
        const highestApy: [string, number] = ['', 0];
        const tokenRevenue: { [key: string]: number } = {};
        const principal = 0;
        const interest = 0;

        // TODO reformat subraph query into data needed for page
        let collateralEvents: CollateralEvent[] = [];
        const mergeColalteralEvents = (type: EscrowTypes, symbol: string, price: number = 0, events: any[]) => {
          let totalVal = 0;
          const newEvents: CollateralEvent[] = events.map((e: any): CollateralEvent => {
            const value = e.amount * price;
            if (type === 'spigot') {
              // aggregate token revenue. not needed for escrow bc its already segmented by token
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

        let creditEvents: CreditEvent[] = [];

        // position id and APY
        const pageData: CreditLinePage = {
          // base
          start: start,
          end: end,
          status: status,
          borrower: borrower,
          principal,
          interest,
          credits: credits.reduce((obj: any, c: any) => {
            const {
              lender,
              principal,
              interest,
              token: { symbol, lastPriceUSD },
            } = c;
            return { ...obj };
          }),
          // escrow
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
                  mergeColalteralEvents('spigot', symbol, lastPriceUSD, events); // normalize and save events
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
                    token: { symbol, lastPriceUSD },
                    events,
                  } = d;
                  mergeColalteralEvents('escrow', symbol, lastPriceUSD, events); // normalize and save events
                  return { ...obj, [id]: { symbol, lastPriceUSD, amount, enabled } };
                }, {}),
              },
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
