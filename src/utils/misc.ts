import { BigNumber, ethers } from 'ethers';
import { keyBy, merge, values, orderBy, toNumber, isString, get } from 'lodash';

import { UseCreditLinesParams } from '@src/core/types';

export const bn = (value: string | number) => {
  if (value.toString().includes('.')) {
    // BN cant handle decimals
    return;
  }

  return BigNumber.from(value);
};

export const isValidAddress = (address: string): boolean => {
  try {
    ethers.utils.getAddress(address);
    return true;
  } catch (e) {
    return false;
  }
};

export const getUniqueAndCombine = (arrayA: any[], arrayB: any[], key: string) => {
  const merged = merge(keyBy(arrayA, key), keyBy(arrayB, key));
  return values(merged);
};

function isNumber(n: any) {
  return typeof n != 'boolean' && !isNaN(n);
}

export const sort = <T>(data: T[], by: Extract<keyof T, string>, order?: 'asc' | 'desc'): T[] => {
  const sortedData = orderBy(
    [...data],
    (item) => {
      const element = item[by];
      if (isNumber(element)) {
        return toNumber(element);
      }
      if (isString(element)) {
        return element.toLowerCase();
      }

      return element;
    },
    [order ?? 'desc']
  );
  return sortedData;
};

export const filterData = <T>(data: T[], keys: Array<keyof T | string>, filter: string): T[] =>
  data.filter((item) => {
    const matches = keys.find((key) => {
      const text = get(item, key);
      if (typeof text === 'string') {
        return text.toLowerCase().includes(filter.toLowerCase());
      }
      return false;
    });
    return !!matches;
  });

export const orderApy = (apyData: string, apyType: string) => {
  if (apyType === 'new') return Number.MAX_SAFE_INTEGER;
  if (apyType === 'n/a') return 0;

  return toNumber(apyData) ?? 0;
};

export const isCustomApyType = (apyType: string) => apyType === 'new' || apyType === 'n/a' || apyType === 'override';

export const getRandomId = (): string => new Date().getTime().toString(36) + Math.random().toString(36).slice(2);

export const getDefaultLineCategories = () => {
  const defaultLineCategories: UseCreditLinesParams = {
    // using i18m translation as keys for easy display
    'market:featured.highest-credit': {
      first: 3,
      // NOTE: terrible proxy for total credit (oldest = most). Currently getLines only allows filtering by line metadata not modules'
      orderBy: 'start',
      orderDirection: 'asc',
    },
    'market:featured.highest-revenue': {
      first: 16,
      // NOTE: terrible proxy for total revenue earned (highest % = highest notional). Currently getLines only allows filtering by line metadata not modules'
      orderBy: 'defaultSplit',
      orderDirection: 'desc',
    },
    'market:featured.newest': {
      first: 15,
      orderBy: 'start', // NOTE: theoretically gets lines that start in the future, will have to refine query
      orderDirection: 'desc',
    },
  };
  return defaultLineCategories;
};
