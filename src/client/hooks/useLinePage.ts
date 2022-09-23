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
        // send action and update store
        // setLinePageData(pageData);
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
