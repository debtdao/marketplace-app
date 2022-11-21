import BigNumber from 'bignumber.js';

import { Wei, Unit, Amount, FormattedAmount, Fraction, DataType } from '@types';

BigNumber.set({ EXPONENTIAL_AT: 50 });

export const USDC_DECIMALS = 6;
export const COLLATERAL_FACTOR_DECIMALS = 18;
export const USD_PRICE_DECIMALS = 8;
export const GWEI = 9;

const FORMAT = {
  prefix: '',
  decimalSeparator: '.',
  groupSeparator: ',',
  groupSize: 3,
  secondaryGroupSize: 0,
  fractionGroupSeparator: ' ',
  fractionGroupSize: 0,
  suffix: '',
};

/* -------------------------------------------------------------------------- */
/*                                    Parse                                   */
/* -------------------------------------------------------------------------- */

export const toBN = (amount?: Amount | number): BigNumber => {
  return new BigNumber(amount || 0);
};

export const toWei = (amount: Unit, decimals: number): Wei => {
  const ONE_UNIT = toBN(10).pow(decimals);
  return toBN(amount).times(ONE_UNIT).toFixed(0);
};

export const toUnit = (amount: Wei | undefined, decimals: number): Unit => {
  const ONE_UNIT = toBN(10).pow(decimals);
  return toBN(amount).div(ONE_UNIT).toString();
};

/* -------------------------------------------------------------------------- */
/*                                  Normalize                                 */
/* -------------------------------------------------------------------------- */

export const normalize = (dataType: DataType, amount?: Wei, decimals?: number): FormattedAmount => {
  if (!amount || amount === '') amount = '0';

  switch (dataType) {
    case 'amount':
      if (!decimals) throw new Error('Invalid Decimals to Format Amount');
      return normalizeAmount(amount, decimals);
    case 'percent':
      return normalizePercent(amount);
    case 'usd':
      return normalizeUsdc(amount);
    default:
      throw new Error('Invalid Format Data Type');
  }
};

export const normalizeAmount = (amount: Wei | undefined, decimals: number): Unit => toUnit(amount, decimals);

export const normalizePercent = (amount: Wei): Unit => toUnit(amount, 4);

export const normalizeUsdc = (amount?: Wei): Unit => toUnit(amount, USDC_DECIMALS);

/* -------------------------------------------------------------------------- */
/*                                   Format                                   */
/* -------------------------------------------------------------------------- */

export const format = (dataType: DataType, amount?: Amount, decimals?: number): FormattedAmount => {
  if (!amount || amount === '') amount = '0';

  switch (dataType) {
    case 'amount':
      if (!decimals) throw new Error('Invalid Decimals to Format Amount');
      return formatAmount(amount, decimals);
    case 'percent':
      return formatPercent(amount, decimals);
    case 'usd':
      return formatUsd(amount, decimals);
    default:
      throw new Error('Invalid Format Data Type');
  }
};

export const formatAmount = (amount: Amount, decimals: number): FormattedAmount =>
  toBN(amount).toFormat(decimals, BigNumber.ROUND_FLOOR, FORMAT);

export const formatPercent = (amount: Fraction, decimals = 2): FormattedAmount =>
  toBN(amount)
    .times(100)
    .toFormat(decimals, { ...FORMAT, suffix: '%' });

export const formatUsd = (amount?: Amount, decimals = 2): FormattedAmount =>
  toBN(amount).toFormat(decimals, { ...FORMAT, prefix: '$ ' });

export const formatApy = (apyData: Fraction, apyType?: string): FormattedAmount => {
  if (apyType === 'error') return '-';
  if (apyType === 'new') return 'NEW ✨';
  if (apyType === 'n/a') return 'N/A';

  return formatPercent(apyData, 2);
};

export const numberWithCommas = (x: string) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/* -------------------------------------------------------------------------- */
/*                                  Humanize                                  */
/* -------------------------------------------------------------------------- */

export const humanize = (
  dataType: DataType,
  amount: Amount | undefined,
  tokenDecimals?: number,
  formatDecimals?: number
) => {
  if (!tokenDecimals && dataType === 'amount') return '0';
  const units = normalize(dataType, amount, tokenDecimals);
  return format(dataType, units, formatDecimals);
};

export const prettyNumbers = (x: string) => {
  return numberWithCommas(parseInt(normalizeAmount(x, 18)).toFixed(2));
};

export const formatAddress = (address: string) => {
  return address.substring(0, 6) + '...' + address.substring(address.length - 4, address.length);
};

export const getENSname = (address: string) => {
  //TO DO: need to set up a provider here.
  const provider = EthersWeb3ProviderImpl.getInstanceOf('ethereum');
  const addressEnsName = await provider.lookupAddress(address);
  return addressEnsName;
};

export const getDate = (timestamp: number) => {
  const months = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
    Jul: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12',
  };
  const date = new Date(timestamp * 1000).toString();
  const dateArr = date.split(' ');
  //@ts-ignore
  const finalDate = `${dateArr[2]}/${months[dateArr[1]]}/${dateArr[3]}, ${dateArr[4]}`;
  return finalDate;
};
