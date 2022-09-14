import { useEffect, useState } from 'react';
import { isEqual } from 'lodash';

import { getEnv } from '@src/config/env';
import { getLines } from '@core/frameworks/gql';
import { CreditLine, GetLinesArgs, UseCreditLinesParams } from '@src/core/types';

import { useSelectedCreditLine } from './useSelectedCreditLine';

export const useCreditLines = (params: UseCreditLinesParams): [CreditLine[] | undefined, Function, Boolean] => {
  const [creditLines, setCreditLines] = useState<CreditLine[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [args, setArgs] = useState<UseCreditLinesParams>(params);
  const { DEBT_DAO_SUBGRAPH_KEY } = getEnv();

  useEffect(() => {
    if (isEqual(params, args)) return;
    setLoading(true);

    const categoryRequests = Object(args).entries(([key, val]: [string, GetLinesArgs]) => {
      getLines(val)
        .then((response: any) => {
          console.log('get lines category res: ', key, response.data);
          return { [key]: response };
        })
        .catch((err) => {
          console.log('err useCreditLines', err);
          setLoading(false);
          return;
        });
    });
    Promise.all(categoryRequests)
      .then((res) => {
        console.log('all getLines reses', res);
        const categories = categoryRequests.reduce((lines: any, l: any) => ({ ...lines, ...l }), {});
        setCreditLines(categories);
        setLoading(false);
      })
      .catch((err) => {
        console.log('err useCreditLines all', err);
        setLoading(false);
        return;
      });
  }, [args]);

  return [creditLines, setArgs, isLoading];
};
